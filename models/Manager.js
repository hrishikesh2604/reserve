const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    
    email: {
        type: String,
        required: true,
       
    },
    
    contact: {
        type: String,
        required: true
    },
    
    companyName:{
        type: String,
        required: true
    },
    
    address:{
        type: String,
        required: true
    },
    
    location:{
        type: String,
        required: true
    },
    
    services: {
        parking:{
            parking_slots:{
                type: Number
            },

            parking_price:{
                type: Number
            },
            booked_slots:[
              
                {
                type: Number
                
            }]
        },
        cleaning:{
            price_carwash:{
                type: Number
            },
          
        },
        charging:{
            charging_price:{
                type: Number
            },
            charging_slots:{
                type: Number
            }
        },
        inspection:{
            inspection_price:{
                type: Number
            }
        },
        painting:{
            painting_price:{
                type: Number
            },
            denting:{
                type: Boolean
            }
        }
        
    },
      profile_pic:{
        type:String,
      },
      
      service_pic:{
        type:String,
      },
      wallet:{
        type:Number,
        default: 0
      },
      transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    registrationDate: {
        type: Date,
        default: Date.now
    }

});

const Manager = mongoose.model('Manager', managerSchema);

module.exports = Manager;
