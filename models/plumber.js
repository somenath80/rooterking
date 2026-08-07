import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    name: {
        type : String,
        required : true
    },
    phone : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
   service: {
       type : String,
        required : true
    },
    message : {
        type : String,
        required : true
    },
    status : {
        type : String,
      default: "Pending"
    },
    created : {
        type : Date,
        default : Date.now
    }
},
 {versionKey : false,
       collection: "plumberData"  
 }
)

export default mongoose.model("Booking",bookingSchema);