const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'maharanikhil917@gmail.com',
        subject: 'Welcome to our subscription',
        text: `hello ${name}, here is what benifits you get from joining us...`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'maharanikhil917@gmail.com',
        subject: 'Sorry to see you leave',
        text: `Bye ${name}, is there anything we can do to keep you going.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}