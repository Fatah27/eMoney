const express = require("express")
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port = 3333

const authCollection = require("../model/authModel")
const topupCollection = require("../model/topupModel")
const pulsaCollection = require("../model/pulsaModel")
const payCollection = require("../model/payModel")

app.use(cors())
app.use(bodyParser.json())

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.post("/signup", async (req, res) => {
    const data = {
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      balance: 0
    }
  
    try {
      const result = await authCollection.insertMany(data)
      console.log(result)
      res.json({ success: true, message: "Signup successful", id: data._id})
    } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: "Internal Server Error" })
    }
})

app.post("/login", async (req, res) => {
    const { username, password } = req.body
  
    try {
      const user = await authCollection.findOne({ username, password })
  
      if (user) {
        res.json({ success: true, message: "Login successful", id: user._id })
      } else {
        res.status(401).json({ success: false, message: "Invalid username or password" })
      }
    } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: "Internal Server Error" })
    }
  })
  
app.get("/balance/:idUser", async (req, res) => {
  const idUser = req.params.idUser

  try {
    const user = await authCollection.findOne({ _id: idUser })

    if (user) {
      const balance = user.balance
      res.json({ success: true, balance })
    } else {
      res.status(404).json({ success: false, message: "User not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
})


app.post("/topup/:idUser", async (req,res) => {
    const timestamp = Date.now()
    const idUser = req.params.idUser
    const topupAmount = req.body.topupAmount
    const isPurchased = false  
  
  try {
    const checkout = {
      timestamp,
      idUser,
      topupAmount,
      isPurchased
    }
    await topupCollection.insertMany(checkout)
    res.json({ success: true, message: "checkout success" })
  } catch(error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Internal Server Error"})
  }
})

app.post("/topup/confirmpayment/:idtopup", async (req, res) => {
  const idTopup = req.params.idtopup
  const paymentProof = req.body.paymentProof

  try {
    const topupTransaction = await topupCollection.findOne({ _id: idTopup })

    if (!topupTransaction) {
      return res.status(404).json({ success: false, message: "Top-up transaction not found" })
    }

    await topupCollection.updateOne(
      { _id: idTopup },
      { $set: { isPurchased: true, paymentProof: paymentProof } }
    )

    const topupAmount = parseFloat(topupTransaction.topupAmount)

    const user = await authCollection.findOne({ _id: topupTransaction.idUser })

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const currentBalance = parseFloat(user.balance)
    const newBalance = currentBalance + topupAmount

    await authCollection.updateOne(
      { _id: topupTransaction.idUser },
      { $set: { balance: newBalance } }
    )

    res.json({ success: true, message: "Payment confirmed", newBalance })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
})

app.post("/pulsa/:idUser", async (req, res) => {
  const timestamp = Date.now()
  const idUser = req.params.idUser
  const pulsaAmount = req.body.pulsaAmount
  const phoneNumber = req.body.phoneNumber
  try {
    const checkout = {
      timestamp,
      idUser,
      pulsaAmount,
      phoneNumber
    }
    await pulsaCollection.insertMany(checkout)
    res.json({ success: true, message: "Pulsa checkout for "+phoneNumber })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
})

app.post("/pulsa/confirmpayment/:idPulsa", async (req, res) => {
  const idPulsa = req.params.idPulsa

  try {
    const pulsaTransaction = await pulsaCollection.findOne({ _id: idPulsa })

    if (!pulsaTransaction) {
      return res.status(404).json({ success: false, message: "Pulsa transaction not found" })
    }

    await pulsaCollection.updateOne(
      { _id: idPulsa },
      { $set: { isPurchased: true } }
    )

    const pulsaAmount = parseFloat(pulsaTransaction.pulsaAmount)

    const user = await authCollection.findOne({ _id: pulsaTransaction.idUser })

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const currentBalance = parseFloat(user.balance)

    if (currentBalance < pulsaAmount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" })
    }

    const newBalance = currentBalance - pulsaAmount

    await authCollection.updateOne(
      { _id: pulsaTransaction.idUser },
      { $set: { balance: newBalance } }
    )

    res.json({ success: true, message: "Payment confirmed", newBalance })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
})

app.post("/pay/:phoneNumber", async (req, res) => {
  const timestamp = Date.now()
  const phoneNumber = req.params.phoneNumber
  const transactionAmount = req.body.transactionAmount

  try {
    const account = await authCollection.findOne({ phoneNumber })

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" })
    }

    const balance = account.balance
    const transactionStatus = balance >= transactionAmount
    const newBalance = transactionStatus ? balance - transactionAmount : balance

    // Update the transaction status and balance in the account
    await authCollection.updateOne(
      { phoneNumber },
      { $set: { transactionStatus, balance: newBalance } }
    )

    // Create a new transaction document in the payCollection
    await payCollection.insertMany({
      phoneNumber,
      transactionAmount,
      timestamp,
      transactionStatus,
    })

    res.json({ success: true, transactionStatus })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
})



app.get("/transaction/:phoneNumber", async (req, res) => {
  const phoneNumber = req.params.phoneNumber

  try {
    const account = await payCollection.findOne({ phoneNumber })

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" })
    }

    const status = account.transactionStatus
    const transactionStatus = determineTransactionStatus(status)

    res.json({ success: true, transactionStatus })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
})

function determineTransactionStatus(status) {
  // Add your logic to determine the transaction status based on the balance
  // For example, if balance is greater than zero, consider it as a successful transaction
  if (status == true) {
    return "SUCCESS"
  }
  
  return "FAILED"
}


app.post("/transfer/:sourcePhoneNumber", async (req, res) => {
  const sourcePhoneNumber = req.params.sourcePhoneNumber
  const targetPhoneNumber = req.body.targetPhoneNumber
  const transferAmount = req.body.transferAmount

  try {
    const sourceAccount = await authCollection.findOne({ phoneNumber: sourcePhoneNumber })

    if (!sourceAccount) {
      return res.status(404).json({ success: false, message: "Source account not found" })
    }

    const targetAccount = await authCollection.findOne({ phoneNumber: targetPhoneNumber })

    if (!targetAccount) {
      return res.status(404).json({ success: false, message: "Target account not found" })
    }

    const sourceBalance = sourceAccount.balance
    const targetBalance = targetAccount.balance

    if (sourceBalance < transferAmount) {
      return res.status(400).json({ success: false, message: "Insufficient balance in the source account" })
    }

    const newSourceBalance = sourceBalance - transferAmount
    const newTargetBalance = targetBalance + transferAmount

    await authCollection.updateOne({ phoneNumber: sourcePhoneNumber }, { $set: { balance: newSourceBalance } })
    await authCollection.updateOne({ phoneNumber: targetPhoneNumber }, { $set: { balance: newTargetBalance } })

    res.json({ success: true, message: "Balance transferred successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
})

try {
  app.listen(port, () => {
    console.log('app listening to port '+port)
  })
} catch (error) {
  console.error(error)
}