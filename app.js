const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname, 'userData.db')
const app = express()
app.use(express.json())
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running...')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const selectedQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbQuery = await db.get(selectedQuery)
  if (dbQuery === undefined) {
    const createdQuery = `INSERT INTO user(username,name,password,gender,location) VALUES(
                    '${username}',
                    '${name}',
                    '${hashedPassword}',
                    '${gender}',
                    '${location}'
            );`
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const dbResponse = await db.run(createdQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectedQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbuser = await db.get(selectedQuery)
  if (dbuser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const ispasswordMatched = await bcrypt.compare(password, dbuser.password)
    if (ispasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
   const selectedQuery = `SELECT * FROM user WHERE username = '${username}';`
    const dbuser = await db.get(selectedQuery)

    if (dbuser === undefined) {
      response.status(400)
      response.send('Invalid user')
    } else {
      const isOldPasswordMatched = await bcrypt.compare(oldPassword, dbuser.password)

      if (isOldPasswordMatched === true) {
        if (newPassword.length < 5) {
          response.status(400)
          response.send('Password is too short')
        } else {
          const hashedNewPassword = await bcrypt.hash(newPassword, 10)
          const updateQuery = `UPDATE user SET password='${hashedNewPassword}' WHERE username='${username}';`
          await db.run(updateQuery)
          response.status(200)
          response.send('Password updated')
        }
      } else {
        response.status(400)
        response.send('Invalid current password')
      }
    }
})
