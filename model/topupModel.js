const mongoose=require("mongoose")

mongoose.connect("mongodb+srv://emoney2023:emoney123@emoney.sphzerj.mongodb.net/?retryWrites=true&w=majority")
.then(()=>{
    console.log('checkout connected')
})
.catch((e)=>{
    console.log(e)
})

const topupSchema = new mongoose.Schema({
    timestamp:{
        type:Number,
        required:true
    },
    idUser:{
        type:String,
        required:true
    },
    topupAmount:{
        type:Number,
        required:true
    },
    isPurchased:{
        type:Boolean,
        required:true
    },
    paymentProof:{
        type:String,
        required:false
    }
    
})

const topupModel=new mongoose.model('topupCollection', topupSchema)

module.exports=topupModel

