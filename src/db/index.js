import mongoose from 'mongoose'
import express from 'express'
import {DB_NAME} from '../constant.js'


const connectDB=async ()=>{
    try {
        const connectionInstances=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`connection established with mongodb HOST: ${connectionInstances.connection.host}`)

    } catch (error) {
        console.log(`mongodb connection failed Error: ${error}`)
        process.exit(1)
    }
}

export default connectDB