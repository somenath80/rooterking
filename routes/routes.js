import mongoose from "mongoose";
import e from "express";
const router = e.Router();
import Booking from "../models/plumber.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
let genAI = null;
let model = null;

function getGeminiModel() {
    if (!model) {
        const rawKey = process.env.GEMINI_API_KEY;
        let apiKey = rawKey ? rawKey.trim() : null;
        
        // USER OVERRIDE: Using the provided key directly to ensure it works
        const fallbackKey = "";

        if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "" || apiKey === "" || apiKey === "undefined") {
            console.warn("Using manually provided fallback API key.");
            apiKey = fallbackKey;
        }

        try {
            console.log("Initializing Gemini AI with key prefix:", apiKey.substring(0, 6) + "...");
            genAI = new GoogleGenerativeAI(apiKey);
           model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        } catch (initError) {
            console.error("Failed to initialize Gemini AI SDK:", initError);
            return null;
        }
    }
    return model;
}

// login page
router.get("/login", (req,resp)=>{
  resp.render("login",{error :null});
})

router.post("/login",(req,resp)=>{
    try {
      const {username,password} = req.body;
       if (username === process.env.LOGIN_USERNAME && password === process.env.LOGIN_PASSWORD) {
        req.session.user = username;
        return resp.redirect("/dashboard")
       }
        return resp.render("login", {
        error: "❌ Invalid username or password"
    });
    } catch (error) {
      console.log(error)
    }
  })

// logout page 
router.get("/logout",(req,resp)=>{
  req.session.destroy(()=>{
 resp.redirect("/login");
  });
})

// home page 
router.get('/', (req, res) => {
  res.render('homepage', { title: 'Fast & Reliable Plumbing Services' });
});

// about page
router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us - Reliable Plumbing Pros' });
});

// contact page
router.get('/contact', (req, res) => {
  const success = req.query.success;
  res.render('contact',
     { title: 'Book Your Service - Contact Us',
      success ,
      message : 'we received your request! thanks'
      });
});

router.get('/services', (req, res) => {
  const services = [
    {
      title: 'Emergency Plumbing',
      description: '24/7 rapid response for burst pipes, flooding, or severe leaks. We arrive within 60 minutes.',
      image: '/images/service1.jpg',
      features: ['24/7 Response', 'Priority Dispatch', 'Damage Control']
    },
    {
      title: 'Drain Cleaning',
      description: 'High-pressure water jetting and fiber-optic camera inspections to clear even the toughest clogs.',
      image: '/images/pro2.jpg',
      features: ['CCTV Inspections', 'Root Removal', 'Hydro-Jetting']
    },
    {
      title: 'Water Heaters',
      description: 'Full installation and repair services for electric, gas, and tankless water heating systems.',
      image: '/images/water-heater.jpg',
      features: ['Tankless Systems', 'Gas & Electric', 'Efficiency Upgrades']
    }
  ];
  res.render('service', { title: 'Our Professional Plumbing Services', services });
});

router.post("/booking", async (req, res) => {
  try {
    // 🔥 FORCE SAFE CONNECTION
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.DB_URL, {
        dbName: "plumberSite",
        serverSelectionTimeoutMS: 15000,
      });
    }

    const { name, email, phone, service, message } = req.body;

    await Booking.create({
      name,
      email,
      phone,
      service,
      message,
      status: "Pending",
    });

    return res.redirect("/contact?success=true");

  } catch (error) {
    console.log("BOOKING ERROR:", error.message);
    return res.status(500).send("Error saving booking");
  }
});

router.get("/dashboard", async (req, resp) => {
  try {
    if (!req.session.user) {
      return resp.redirect("/login");
    }

    if (mongoose.connection.readyState !== 1) {
      console.log(`DB Status is ${mongoose.connection.readyState}. Fixing connection...`);
      await mongoose.connect(process.env.DB_URL, { 
        dbName: "plumberSite",
        serverSelectionTimeoutMS: 5000 
      });
      console.log("Database successfully reconnected!");
    }

    const allBookings = await Booking.find().sort({ createdAt: -1 });
    
    resp.render("dashboard", {
      booking: allBookings
    });

  } catch (error) {
    console.error("CRITICAL DASHBOARD ERROR:", error.message);
    resp.status(500).send("System Error: " + error.message);
  }
});

router.post("/delete/:id", async (req,resp)=>{
  await Booking.findByIdAndDelete(req.params.id);
  resp.redirect('/dashboard');
});

router.post('/status/:id', async (req,resp)=>{
  const {status} = req.body;
  await Booking.findByIdAndUpdate(req.params.id, {status});
  resp.redirect("/dashboard");
})

// CHATBOT API
router.get("/debug-ai", (req, res) => {
    res.render("debug-ai");
});



router.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const msg = message.toLowerCase();
    let reply = "";

    // Manual/Rule-based Fallback
    if (msg.includes("price") || msg.includes("cost") || msg.includes("how much")) {
        reply = "Pricing depends on the job. We offer competitive rates and free estimates. Call us at +1 780-456-8060 for a quote!";
    } else if (msg.includes("book") || msg.includes("service") || msg.includes("hire") || msg.includes("help")) {
        reply = "You can book a service by visiting our 'Contact' page or calling +1 780-456-8060. We're here 24/7!";
    } else if (msg.includes("emergency") || msg.includes("burst") || msg.includes("flood")) {
        reply = "EMERGENCY! Please call +1 780-456-8060 immediately. Our 24/7 mobile units are ready to help!";
    } else if (msg.includes("where") || msg.includes("location") || msg.includes("canada")) {
        reply = "We are located in Edmonton, Alberta, and serve most surrounding areas in Canada!";
    } else if (msg.includes("who") || msg.includes("company") || msg.includes("rooter king")) {
        reply = "We are Rooter King Canada, your local experts in emergency plumbing and drain cleaning.";
    }

    // Try AI if no manual match or just to be smart
    const aiModel = getGeminiModel();
    if (aiModel && !reply) {
        try {
            const prompt = `You are a plumbing assistant for "Rooter King Canada". 
            Services: EMERGENCY (+1 780-456-8060), Drain Cleaning, Water Heaters.
            Rules: Short answers. Professional. No markdown. Tell them to book on Contact page.
            User: ${message}`;
            
            const result = await aiModel.generateContent(prompt);
            const response = await result.response;
            reply = response.text();
        } catch (aiError) {
            console.error("AI Generation Error Details:", aiError);
            if (aiError.response && aiError.response.promptFeedback) {
                console.error("Safety Feedback:", JSON.stringify(aiError.response.promptFeedback));
            }
            if (!reply) reply = "I'm having trouble with my AI brain right now (Error: " + (aiError.message || "Unknown") + "). Please call our team at +1 780-456-8060 for help!";
        }
    }

    // Final fallback
    if (!reply) {
        reply = "I'm not sure about that. Would you like to call our emergency line at +1 780-456-8060 or visit our Contact page?";
    }

    res.json({ reply });
  } catch (error) {
    console.error("Chatbot Engine Error:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
});


// sampele code 


router.get("/test-db", async (req, res) => {
  try {
    // check mongoose state first
    const state = mongoose.connection.readyState;

    const states = {
      0: "DISCONNECTED",
      1: "CONNECTED",
      2: "CONNECTING",
      3: "DISCONNECTING"
    };

    // if not connected, show clear error immediately
    if (state !== 1) {
      return res.status(500).json({
        success: false,
        message: "MongoDB not connected",
        state: states[state],
        hint: "Check DB_URL on Vercel"
      });
    }

    // try ping DB
    const result = await mongoose.connection.db.admin().ping();

    return res.status(200).json({
      success: true,
      message: "DB WORKING",
      mongoState: states[state],
      ping: result
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "DB ERROR",
      error: err.message,
      fullError: err
    });
  }
});


export default router;
