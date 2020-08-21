const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')


const app = express()
const port = process.env.PORT

//parses the incomming json request implecitly
app.use(express.json())
//to use the Router defined in router/user file
app.use(userRouter)
//to use the Router defined in routers/task
app.use(taskRouter)

app.listen(port, () => {
    console.log('Server is up and running at ' + port)
})