const express=require('express');
const router=express.Router();
const {verifyToken}=require('../middleware/auth.js');
const {getmanagers}=require('../middleware/Manager.js');
const User =require('../models/User.js')
const Booking =require('../models/Booking.js')
const jwt=require('jsonwebtoken')
const path = require('path');
const upload = require("./multer.js");
const { decode } = require('punycode');
const {managerLogout}=require('../controllers/auth.js')
const Manager=require('../models/Manager');
const Transaction =require('../models/Transaction');
const {updateinfo}=require('../controllers/Manager')
const {addmoney}=require('../controllers/Manager.js')
const managers =require('../controllers/Manager')

router.get("/dashboard",verifyToken, getmanagers, async(req, res) => {
    
      const weeklyProfit = await managers.calculateWeeklyProfit(req.manager._id);
      const totalBookings = await managers.calculateDailyBookings(req.manager._id);
// In your routes/Manager.js file
const bookingCounts = [
  totalBookings.parking,
  totalBookings.charging,
  totalBookings.cleaning,
  totalBookings.inspection,
  totalBookings.painting
];

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 for comparison
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); // Get tomorrow's date

  try {
      // Fetch user registrations today
      const userRegistrationsToday = await Transaction.countDocuments({
          incoming_user: true,
          registration_date: { $gte: today, $lt: tomorrow },
          manager: req.manager._id
      });

      // Fetch transactions where registration date is today and incoming manager ID matches
      const transactionsToday = await Transaction.find({
          incoming_manager: true,
          registration_date: { $gte: today, $lt: tomorrow },
          manager: req.manager._id // Assuming req.manager contains the current manager's details
      });

      const serviceRegistrations = await Booking.aggregate([
        { 
            $match: { 
                manager: req.manager._id // Filter bookings by manager
            } 
        },
        {
            $group: {
                _id: "$service",
                count: { $sum: 1 } // Counting the number of bookings for each service
            }
        }
    ]);

      const serviceCounts = serviceRegistrations.map(service => ({
        service: service._id,
        count: service.count
    }));

      // Calculate total amount
      const totalAmountToday = transactionsToday.reduce((total, transaction) => total + transaction.amount, 0);

    const bookings = await Booking.find().populate(["user","manager"]);

    const currbookings = [];

    bookings.forEach(function(booking){
      if(booking.manager!==null){
        if(booking.manager._id===req.manager._id){
          currbookings.push(booking);
        }
      }
    });

    const bookingsthisweek = [];
    currbookings.forEach(function(booking){
      const todayObj = new Date();
      const todayDate = todayObj.getDate();
      const todayDay = todayObj.getDay();
      const managerdate = booking.date;
      // get first date of week
      const firstDayOfWeek = new Date(todayObj.setDate(todayDate - todayDay));

      // get last date of week
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

      // if date is equal or within the first and last dates of the week
      if(managerdatedate >= firstDayOfWeek && managerdate <= lastDayOfWeek){
        bookingsthisweek.push(booking);
      }
    })
    

      res.render('manager_dashboard', {
          manager: req.manager,
          userRegistrationsToday,
          serviceCounts: serviceCounts,
          totalAmountToday, weeklyProfit: weeklyProfit, totalBookings: totalBookings, bookingsthisweek : bookingsthisweek} );
  } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
  
router.get("/bookings",verifyToken,async(req, res) => {
  const token = req.cookies.authorization;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const manager = await Manager.findById(decoded.id).select('-password');
    if (!manager) {
      return res.status(404).json({ error: "Manager not found" });
    }

    Booking.find({ manager: manager._id })
        .populate('user') // Populate the user field to get user details
        .then(bookings => {
            res.render('manager_bookings', {manager: manager, bookings: bookings});
        })
});

router.post('/deleteBooking', verifyToken, managers.Bookingdeleted, async(req, res) => {
  const token = req.cookies.authorization;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const manager = await Manager.findById(decoded.id).select('-password');
    if (!manager) {
      return res.status(404).json({ error: "Manager not found" });
    }
  });

router.get("/schedule",verifyToken,async(req, res) => {
  const token = req.cookies.authorization;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const manager = await Manager.findById(decoded.id).select('-password');
    if (!manager) {
      return res.status(404).json({ error: "Manager not found" });
    }
    res.render('manager_schedule', {manager});
});

router.get("/logout",managerLogout)
 

router.get("/services",verifyToken,async(req, res) => {
  const token = req.cookies.authorization;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const manager = await Manager.findById(decoded.id).select('-password');
    if (!manager) {
      return res.status(404).json({ error: "Manager not found" });
    }
    res.render('manager_services', {manager});
});

router.get("/update",verifyToken,async(req, res) => {
  const token = req.cookies.authorization;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const manager = await Manager.findById(decoded.id).select('-password');
    if (!manager) {
      return res.status(404).json({ error: "Manager not found" });
    }
    console.log(manager.services.cleaning);
    res.render('manager_update', {manager});
});

router.get("/wallet",verifyToken,async(req, res) => {
  const token = req.cookies.authorization;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const manager = await Manager.findById(decoded.id).select('-password');
    if (!manager) {
      return res.status(404).json({ error: "Manager not found" });
    }
    const transactions = await Transaction.find().populate(["user","manager"]);
    const finaltransactions = [];

    transactions.forEach(function(transaction){
      if(transaction.user!==null && transaction.manager!==null){
        finaltransactions.push(transaction);
      }
    });
    res.render('manager_wallet', {manager:manager, transactions : finaltransactions});
});

router.post("/fileupload",verifyToken,upload.single("image"), async function(req,res){
  const token = req.cookies.authorization;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const manager = await Manager.findById(decoded.id).select('-password');

  if(!manager){
    return res.status(404).json({error:"Manager not found"});
  }
  manager.profile_pic = req.file.filename;
  await manager.save();
  res.redirect("/managers/dashboard");
});


router.post("/update",getmanagers,updateinfo);
router.post("/wallet",getmanagers,addmoney)
module.exports = router;

