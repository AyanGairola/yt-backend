import mongoose from "mongoose";

const subscriptionSchema=new mongoose.Schema({
    subscriber:{
        type:mongoose.Schema.Types.ObjectId, //The one who is subscribing
        ref:"User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId, //The one who is being subscribed
        ref:"User"
    }


},{timestamps:true})


export const Subscription=mongoose.model("Subscription",subscriptionSchema)