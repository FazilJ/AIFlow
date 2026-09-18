const { testRag } = require("../service/ragTestService");

const runRagTest = async (req, res, next) => {
  try {
    const {
      businessId,
      question,
      knowledgeBaseId,
      topK,
    } = req.body;

    const result = await testRag({
      user: req.user,
      businessId,
      question,
      knowledgeBaseId,
      topK,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runRagTest,
};