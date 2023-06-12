const mongoose=require("mongoose")

mongoose.connect("mongodb+srv://emoney2023:emoney123@emoney.sphzerj.mongodb.net/?retryWrites=true&w=majority")
.then(()=>{
    console.log('pulsa connected')
})
.catch((e)=>{
    console.log(e)
})

const pulsaSchema = new mongoose.Schema({
    timestamp:{
        type:Number,
        required:true
    },
    idUser:{
        type:String,
        required:true
    },
    pulsaAmount:{
        type:Number,
        required:true
    },
    phoneNumber:{
        type:Number,
        required:true
    }
    
})

const pulsaModel=new mongoose.model('pulsaCollection', pulsaSchema)

module.exports=pulsaModel

