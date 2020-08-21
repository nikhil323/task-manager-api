const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Tasks = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }, 
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value) ) {
                throw new Error('Email is invalid')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('age can not be negative')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if(value.toLowerCase().includes('password') ){
                throw new Error('this password is easily guessable')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    profile: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Tasks',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const userObject = this.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.profile

    return userObject

}

userSchema.methods.generateAuthToken = async function() {
    const token = jwt.sign({_id: this._id.toString()}, process.env.JWT_SECRET_KEY)

    this.tokens = this.tokens.concat({ token })
    await this.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await Users.findOne({ email })

    if(!user) {
        throw new Error('unable to login')
    }
    
    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) {
        throw new Error('unable to login')
    }

    return user
}


// Middleware for hashing before save
userSchema.pre('save', async function(next) {

    if(this.isModified('password') ){
        this.password = await bcrypt.hash(this.password, 8)
    }

    next()
})

//deleting tasks associated with user when user is removed
userSchema.pre('remove', async function(next) {
    await Tasks.deleteMany({ owner: this._id})

    next()
})

const Users = mongoose.model('Users', userSchema)

module.exports = Users