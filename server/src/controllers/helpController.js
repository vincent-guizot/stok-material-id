import { HelpContent } from '../models/index.js';

// Konten Pusat Bantuan dikelompokkan per jenis: guide, video, faq, shortcut, contact, about.
export const getHelp = async (req, res, next) => {
  try {
    const rows = await HelpContent.findAll({ order: [['kind', 'ASC'], ['sortOrder', 'ASC']] });
    const grouped = {};
    for (const r of rows) (grouped[r.kind] ||= []).push({ id: r.id, title: r.title, body: r.body, extra: r.extra });
    res.json({ success: true, data: grouped });
  } catch (err) { next(err); }
};
