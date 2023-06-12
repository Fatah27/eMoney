const mongoose=require("mongoose")

mongoose.connect("mongodb+srv://emoney2023:emoney123@emoney.sphzerj.mongodb.net/?retryWrites=true&w=majority")
.then(()=>{
    console.log('auth connected')
})
.catch((e)=>{
    console.log(e)
})

const authSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phoneNumber:{
        type:String,
        required:true
    },
    balance:{
        type:Number,
        required:true
    }
})

const authCollection=new mongoose.model('authCollection',authSchema)

module.exports=authCollection
