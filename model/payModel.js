const mongoose=require("mongoose")

mongoose.connect("mongodb+srv://emoney2023:emoney123@emoney.sphzerj.mongodb.net/?retryWrites=true&w=majority")
.then(()=>{
    console.log('pay connected')
})
.catch((e)=>{
    console.log(e)
})

const paySchema = new mongoose.Schema({
    timestamp:{
        type:Number,
        required:true
    },
    phoneNumber:{
        type:Number,
        required:true
    },
    transactionAmount:{
        type:Number,
        required:true
    },
    transactionStatus:{
        type:Boolean,
        required:true
    }
    
})

const payModel=new mongoose.model('payCollection', paySchema)

module.exports=payModel

