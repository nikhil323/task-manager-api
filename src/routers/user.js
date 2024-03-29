const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const Users = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router()

//to create a User instance, save it n send 
router.post('/users', async (req, res) => {
    const user = new Users(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

// creating login endpoint
router.post('/users/login', async (req, res) => {
    try {
        const user = await Users.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch (e) {
        res.status(400).send()
    }

})

//logging out a single user
router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

//logging out all users 
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    }  catch (e) {
        res.status(500).send()
    }
})

//to read User Profile  n send it
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})


//to update a field of the Users collection
router.patch('/users/me', auth, async (req, res) => {
    const update = Object.keys(req.body)
    const availableUpdates = ['name', 'age', 'email', 'password']
    const isValidOperation = update.every((item) => availableUpdates.includes(item))

    if(!isValidOperation) {
        return res.status(400).send( { error: 'Invalid update(s)'})
    }

    try {
     update.forEach((update) => req.user[update] = req.body[update])

     await req.user.save()
        

        
     res.send(req.user)

    } catch (e) {
        res.status(400).send(e)
    }
})

//to delete a user by id
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch(e) {
        res.status(500).send()
    }
})

const upload = multer({
    limits : {
        fileSize : 1000000
    },
    fileFilter (req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please provide valid images...'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/profile', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.profile = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/profile', auth, async(req, res) => {
    try {
        req.user.profile = undefined 
        await req.user.save()
        res.send()
    } catch (e) {
        req.status(400).send()
    }
})

router.get('/users/:id/profile', async (req, res) => {
    try {
        const user = await Users.findById(req.params.id)

        if(!user || !user.profile) {
            throw new Error()
        }
        res.set('Content-Type','image/png')
        res.send(user.profile)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router