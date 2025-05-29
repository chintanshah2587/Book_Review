const { getConnection } = require('../config/db');

function transactionalControllerWrapper(fn) {
  return async function (req, res, next) {
    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      const conn = { connection, req, res, next };
      const result = await fn(conn);

      await connection.commit();
      if (!res.headersSent) {
        res.json({ msg: 'success', data: result });
      }
    } catch (error) {
      await connection.rollback();
      console.error('Transaction Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ msg: 'error', error: error.message });
      }
    } finally {
      connection.release();
    }
  };
}

module.exports = { transactionalControllerWrapper };
