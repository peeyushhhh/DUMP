const { chatWithTherapist } = require('../services/aiService')

async function chat(req, res, next) {
  try {
    const { messages } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages array required' })
    }

    // Validate shape, cap history at 20 turns
    const sanitized = messages
      .slice(-20)
      .filter(m => m.role && m.content && typeof m.content === 'string')
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, 500) }))

    const reply = await chatWithTherapist(sanitized)
    res.json({ success: true, reply })
  } catch (err) {
    next(err)
  }
}

module.exports = { chat }