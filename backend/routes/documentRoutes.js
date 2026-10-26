import express from 'express'

import {
    uploadDocument,
    getDocument,
    getDocuments,
    deleteDocument,
    updateDocument
} from '../controllers/documentController.js'
import upload from '../config/multer.js';

import protect from '../middleware/auth.js'
import { runValidation, validId, validTitle } from '../middleware/validate.js'



const router=express.Router()

// All Routes protecter
router.use(protect)

// multer runs first so the multipart `title` field is on req.body when validated
router.post('/upload',upload.single('file'),validTitle(),runValidation,uploadDocument)
router.get('/',getDocuments)
router.get('/:id',validId('id'),runValidation,getDocument)
router.delete('/:id',validId('id'),runValidation,deleteDocument)
router.put('/:id',validId('id'),validTitle(),runValidation,updateDocument)




export default router
