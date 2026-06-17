import Note from '../models/Note.js';
import Chat from '../models/Chat.js';
import { getIO } from '../socket/emitter.js';

export const createNote = async (req, res) => {
  try {
    const { title, summary, sections, files, tags, isPublic } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const note = new Note({
      user: req.user._id,
      title: title.trim(),
      summary: summary || '',
      sections: sections || [],
      files: files || [],
      tags: tags || [],
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await note.save();

    const populated = await Note.findById(note._id)
      .populate('user', '-password');

    const io = getIO();
    if (io) {
      const chats = await Chat.find({ participants: req.user._id });
      const notified = new Set();
      for (const chat of chats) {
        for (const pid of chat.participants) {
          const pidStr = pid.toString();
          if (pidStr !== req.user._id.toString() && !notified.has(pidStr)) {
            notified.add(pidStr);
            io.to(`chat:${chat._id}`).emit('friendUpdate', {
              type: 'note',
              user: populated.user,
              title: populated.title,
              summary: populated.summary,
              createdAt: populated.createdAt
            });
          }
        }
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('CreateNote error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, sections, files, tags, isPublic } = req.body;

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this note.' });
    }

    if (title !== undefined) note.title = title.trim();
    if (summary !== undefined) note.summary = summary;
    if (sections !== undefined) note.sections = sections;
    if (files !== undefined) note.files = files;
    if (tags !== undefined) note.tags = tags;
    if (isPublic !== undefined) note.isPublic = isPublic;

    await note.save();

    const populated = await Note.findById(note._id)
      .populate('user', '-password');

    res.json(populated);
  } catch (error) {
    console.error('UpdateNote error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this note.' });
    }
    await note.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('DeleteNote error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserNotes = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = { user: userId };
    const requestingUser = req.user._id.toString();

    if (userId !== requestingUser) {
      query.isPublic = true;
    }

    const notes = await Note.find(query)
      .populate('user', '-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Note.countDocuments(query);

    res.json({
      notes,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('GetUserNotes error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('user', '-password');

    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const isOwner = note.user._id.toString() === req.user._id.toString();
    if (!note.isPublic && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to view this note.' });
    }

    res.json(note);
  } catch (error) {
    console.error('GetNoteById error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  createNote,
  updateNote,
  deleteNote,
  getUserNotes,
  getNoteById
};
