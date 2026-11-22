// Nomor dokumen berurutan per hari: PREFIX-YYYYMMDD-NN (zona Asia/Jakarta), aman untuk permintaan paralel.
import { Op } from 'sequelize';

export const jakartaDate = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

export async function nextDocNumber(sequelize, t, { prefix, model, field, date = jakartaDate() }) {
  const stamp = date.replace(/-/g, '');
  const head = `${prefix}-${stamp}-`;
  await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:k))', { replacements: { k: head }, transaction: t });
  const last = await model.findOne({
    where: { [field]: { [Op.like]: `${head}%` } },
    order: [[field, 'DESC']],
    attributes: [field],
    transaction: t,
  });
  const seq = last ? parseInt(String(last[field]).slice(head.length), 10) + 1 : 1;
  return `${head}${String(seq).padStart(2, '0')}`;
}
