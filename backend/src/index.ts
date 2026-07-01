import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import submissionsRouter from './routes/submissions'
import validateRouter from './routes/validate'

const app = express()
const PORT = process.env.PORT ?? 4000

app.use(cors())
app.use(express.json())

app.use('/submissions', submissionsRouter)
app.use('/validate', validateRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
