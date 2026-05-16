const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const userExists = await prisma.user.findUnique({ where: { email } })
    if (userExists) {
      return res.status(400).json({ error: 'Email já cadastrado' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    })

    const token = generateToken(user.id)

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const token = generateToken(user.id)

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

module.exports = { register, login }