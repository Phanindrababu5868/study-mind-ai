import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { chunkText } from '../utils/textChunker.js';
import mongoose from 'mongoose';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import {
  buildDocumentKey,
  uploadBufferToR2,
  deleteObjectFromR2,
  getSignedDownloadUrl,
  downloadBufferFromR2,
} from '../utils/storageService.js';

// @desc    Upload PDF document
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
        statusCode: 400,
      });
    }

    const {title} =req.body 

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a document title",
        statusCode: 400,
      });
    }

    // Upload the buffer (never touches this server's disk) straight to R2
    const objectKey = buildDocumentKey(req.user._id, req.file.originalname);
    await uploadBufferToR2(req.file.buffer, objectKey, req.file.mimetype);

    // Create document record — filePath stores the R2 object key, not a
    // public URL. Access is only ever granted via a short-lived signed URL
    // generated after an ownership check (see getDocument below).
    const document = await Document.create({
    userId: req.user._id,
    title: title.trim(),
    fileName: req.file.originalname,
    filePath: objectKey,
    fileSize: req.file.size,
    status: 'processing'
    });

    // Process PDF in background (in production, use a queue like Bull)
    processPDF(document._id, req.file.buffer).catch(err => {
    console.error('PDF processing error:', err);
    });

    res.status(201).json({
    success: true,
    data: document,
    message: 'Document uploaded sucessfully, processing in progess...'
    })

  } catch (error) {
    next(error);
  }
};

// Helper function to process PDF
const processPDF = async (documentId, buffer) => {
  try {
    const { text } = await extractTextFromPDF(buffer);

    // Create chunks
    const chunks = chunkText(text, 500, 50);

    // Update document
    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      status: 'ready'
    });

    console.log(`Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);

    await Document.findByIdAndUpdate(documentId, {
      status: 'failed'
    });
  }
};

// Processing runs in-process, so a restart mid-way leaves documents stuck in
// 'processing' forever. Called once on startup: re-download each stuck PDF
// from R2 and process it again (one at a time, to keep memory use flat).
export const recoverStuckDocuments = async () => {
  const stuck = await Document.find({ status: 'processing' }).select('_id filePath');
  if (!stuck.length) return;

  console.log(`Recovering ${stuck.length} document(s) stuck in processing`);

  for (const doc of stuck) {
    try {
      const buffer = await downloadBufferFromR2(doc.filePath);
      await processPDF(doc._id, buffer);
    } catch (error) {
      console.error(`Could not recover document ${doc._id}:`, error.message);
      await Document.findByIdAndUpdate(doc._id, { status: 'failed' });
    }
  }
};

// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Counts related items for one document without loading them. Matching
    // on userId as well as documentId lets the {userId, documentId} index
    // on flashcards/quizzes be used instead of scanning the collection.
    const countRelated = (from, as) => ({
      $lookup: {
        from,
        localField: '_id',
        foreignField: 'documentId',
        pipeline: [{ $match: { userId } }, { $count: 'count' }],
        as,
      },
    });

    const [result] = await Document.aggregate([
      { $match: { userId } },
      // Drop the heavy text fields first so later stages never carry them
      { $project: { extractedText: 0, chunks: 0 } },
      { $sort: { uploadDate: -1 } },
      {
        // $facet runs both branches in one round trip: `data` for the current
        // page, `totalCount` for the total the page count is computed from.
        // Counts are looked up only for the documents on this page.
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            countRelated('flashcards', 'flashcardCount'),
            countRelated('quizzes', 'quizCount'),
            {
              $addFields: {
                flashcardCount: { $ifNull: [{ $first: '$flashcardCount.count' }, 0] },
                quizCount: { $ifNull: [{ $first: '$quizCount.count' }, 0] },
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const documents = result?.data || [];
    const total = result?.totalCount?.[0]?.count || 0;
    res.status(200).json(
        {success: true,
        count: documents.length,
        pagination: buildPaginationMeta(page, limit, total),
        data:documents
    })
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user document
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params||{};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document id",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
        statusCode: 404,
      });
    }

    // Get Count of  assiotated flashcards and  quizzes
    const flashCardCount= await Flashcard.countDocuments({documentId:document?._id,userId:req.user?._id})
    const quizzesCount=await Quiz.countDocuments({userId:req.user?._id,documentId:document?._id})

    // Update lastAccessed without triggering full validation/hooks unnecessarily
    document.lastAccessed = new Date();
    await document.save();

    const documentData=document.toObject()
    documentData.flashCardCount=flashCardCount
    documentData.quizzesCount=quizzesCount

    // Ownership was already verified in the query above — only now do we
    // mint a signed URL, and it expires in 5 minutes.
    documentData.fileUrl = await getSignedDownloadUrl(document.filePath);
    delete documentData.filePath; // internal R2 key, never expose it directly

    return res.status(200).json({
      success: true,
      data:documentData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params||{};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document id",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
        statusCode: 404,
      });
    }

    // Remove the object from R2
    await deleteObjectFromR2(document.filePath).catch(() => {});

    // Remove related flashcards, quizzes and chat history tied to this document
    await Flashcard.deleteMany({ documentId: document._id });
    await Quiz.deleteMany({ documentId: document._id });
    await ChatHistory.deleteMany({ documentId: document._id });

    await document.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update document title
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document id",
        statusCode: 400,
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a document title",
        statusCode: 400,
      });
    }

    const document = await Document.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { title: title.trim() },
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
        statusCode: 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document updated successfully",
      document: {
        id: document._id,
        title: document.title,
      },
    });
  } catch (error) {
    next(error);
  }
};