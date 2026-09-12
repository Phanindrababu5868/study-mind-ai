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



const router=express.Router()

// All Routes protecter
router.use(protect)

router.post('/upload',upload.single('file'),uploadDocument)
router.get('/',getDocuments)
router.get('/:id',getDocument)
router.delete('/:id',deleteDocument)
router.put('/:id',updateDocument)




export default router