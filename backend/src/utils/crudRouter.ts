
import express from 'express';
import { Model, isValidObjectId } from 'mongoose';

const crudRouter = (model: Model<any>) => {
    const router = express.Router();

    // GET all documents
    router.get('/', async (req, res) => {
        try {
            const documents = await model.find();
            res.json(documents.map(d => d.toJSON()));
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    });

    // POST a new document
    router.post('/', async (req, res) => {
        try {
            const newDocument = new model(req.body);
            await newDocument.save();
            res.status(201).json(newDocument.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: 'Invalid data', error: error.message });
        }
    });

    // GET a single document by ID
    router.get('/:id', async (req, res) => {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        try {
            const document = await model.findById(req.params.id);
            if (!document) {
                return res.status(404).json({ message: 'Document not found' });
            }
            res.json(document.toJSON());
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    });

    // PUT (update) a document by ID
    router.put('/:id', async (req, res) => {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        try {
            const updatedDocument = await model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedDocument) {
                return res.status(404).json({ message: 'Document not found' });
            }
            res.json(updatedDocument.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: 'Invalid data', error: error.message });
        }
    });

    // DELETE a document by ID
    router.delete('/:id', async (req, res) => {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        try {
            const deletedDocument = await model.findByIdAndDelete(req.params.id);
            if (!deletedDocument) {
                return res.status(404).json({ message: 'Document not found' });
            }
            res.status(204).send(); // No content
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    });

    return router;
};

export default crudRouter;