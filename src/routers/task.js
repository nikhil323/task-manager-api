const express = require('express')
const Tasks = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

//to create an instance of Tasks, save it n send
router.post('/tasks', auth, async (req, res) => {
    const task = new Tasks({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

//to read all instances of Tasks n send it
//GET /tasks?completed:true/false
// /tasks?limit=2&skip=0
// /tasks/sortBy=createdAt_desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    if(req.query.completed) {
        match.completed = req.query.completed === "true"
    }

    sort = {}
    if(req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc'? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

//to read instance of Tasks n send it
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Tasks.findOne({ _id, owner: req.user._id })

        if(!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

//to update a field in Task collection
router.patch('/tasks/:id', auth, async (req, res) => {
    const update = Object.keys(req.body)
    const possibleUpdates = ['description', 'completed']
    const isValidOperation = update.every((update) => possibleUpdates.includes(update) )

    if(!isValidOperation) {
        return res.status(400).send( { error: 'Invalid updates'})
    }

    try {
        const task = await Tasks.findOne({_id: req.params.id, owner: req.user._id})

        if(!task) {
            return res.status(404).send()
        }

        update.forEach((update) => task[update] = req.body[update])

        await task.save()
        
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

//to delete a task by id
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Tasks.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if(!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch(e) {
        res.status(500).send()
    }
})

module.exports = router