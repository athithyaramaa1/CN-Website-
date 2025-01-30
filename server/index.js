const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 443;
const MAX_TEAMS = 25;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Configure CORS with more specific options
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow these HTTP methods
    allowedHeaders: '*', // Allow these headers
    credentials: true, // Allow credentials
    optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
}));

app.use(express.json());

// Get all problem statements
app.get('/api/problems', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('problem_statements')
            .select('*')
            .order('title');

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Check registration availability
app.get('/api/registration-status', async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('team_registrations')
            .select('*', { count: 'exact' });

        if (error) throw error;

        res.status(200).json({
            success: true,
            isOpen: count < MAX_TEAMS,
            remainingSlots: MAX_TEAMS - count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Register a team
app.post('/api/register', async (req, res) => {
    const client = await supabase.rest.connection();
    
    try {
        await client.transaction(async (tx) => {
            // Check if registration is still open
            const { count: teamCount } = await tx
                .from('team_registrations')
                .select('*', { count: 'exact' });

            if (teamCount >= MAX_TEAMS) {
                throw new Error('Registration closed: Maximum teams reached');
            }

            const { teamData, problemStatementId } = req.body;

            // Check if problem statement is available
            const { data: problem, error: problemError } = await tx
                .from('problem_statements')
                .select('teams_assigned')
                .eq('id', problemStatementId)
                .single();

            if (problemError) throw problemError;
            if (problem.teams_assigned >= 3) {
                throw new Error('Problem statement no longer available');
            }

            // Update problem statement count
            const { error: updateError } = await tx
                .from('problem_statements')
                .update({ teams_assigned: problem.teams_assigned + 1 })
                .eq('id', problemStatementId);

            if (updateError) throw updateError;

            // Register team
            const { data, error } = await tx
                .from('team_registrations')
                .insert([{ ...teamData, problem_statement_id: problemStatementId }]);

            if (error) throw error;

            res.status(200).json({
                success: true,
                message: 'Registration successful',
                data
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Initialize problem statements (run once)
app.get('/api/init-problems', async (req, res) => {
    try {
        const problemStatements = [
            {
                title: "AI-Powered Phishing Detection System",
                description: "Develop a system to detect and prevent sophisticated phishing attacks using AI. The system should identify deceptive emails, SMS (smishing), fraudulent websites, and modern techniques like AI-generated emails and deepfake voice phishing (vishing)."
            },
            {
                title: "Password-less Secure Authentication System",
                description: "Create a secure authentication system that eliminates the need for traditional passwords while maintaining strong security. Address challenges like biometric privacy, hardware token adoption, and protection against credential-stuffing attacks."
            },
            {
                title: "Fake News Detection Tool",
                description: "Build a real-time fake news detection system that analyzes news articles and identifies misinformation using source credibility, language patterns, and fact verification to help users verify content authenticity."
            },
            {
                title: "Cybersecurity Awareness Chatbot",
                description: "Design an interactive chatbot that educates users about cybersecurity best practices, helping them recognize and avoid common security threats through engaging, personalized conversations."
            },
            {
                title: "Credit Card Fraud Detection System",
                description: "Develop an AI-based system to detect fraudulent credit card transactions in real-time by analyzing spending patterns, geolocation data, and transaction frequencies while minimizing false positives."
            },
            {
                title: "Cybercrime Reporting & Analysis System",
                description: "Create a user-friendly platform for reporting and analyzing cybercrime incidents, helping law enforcement track trends and create targeted responses to emerging threats."
            },
            {
                title: "Ransomware Detection & Prevention System",
                description: "Build a proactive system to detect and prevent ransomware attacks using advanced techniques to identify new variants, fileless attacks, and encryption attempts in real-time."
            },
            {
                title: "Deepfake Detection System",
                description: "Develop a system to automatically detect AI-generated deepfake content across various media types (audio, video, images) to combat misinformation and protect content integrity."
            },
            {
                title: "Online Fraud Detection System",
                description: "Create an advanced fraud detection system that identifies various types of online fraud including phishing scams, identity theft, and account takeovers using real-time transaction analysis."
            },
            {
                title: "Secure Password Manager",
                description: "Design a user-friendly password management system with strong encryption, cross-platform compatibility, and intuitive interfaces to help users maintain unique, secure passwords."
            },
            {
                title: "Data Encryption Tool",
                description: "Build an educational encryption tool that demonstrates various encryption methods while helping users understand the importance of data protection and privacy."
            },
            {
                title: "Secure File Sharing Platform",
                description: "Develop an end-to-end encrypted file sharing platform with granular permission controls and user-friendly interfaces for secure document collaboration."
            },
            {
                title: "Online Payment Fraud Detection",
                description: "Create an AI-driven system to detect fraudulent online payment transactions in real-time while maintaining a positive user experience for legitimate customers."
            },
            {
                title: "Antivirus Software with Real-Time Protection",
                description: "Design a lightweight antivirus solution with real-time protection capabilities, focusing on modern threats while maintaining system performance."
            },
            {
                title: "Educational Keylogger System",
                description: "Develop a controlled, educational keylogger tool to demonstrate security vulnerabilities and raise awareness about keystroke logging risks in a safe environment."
            }
        ];

        const { data, error } = await supabase
            .from('problem_statements')
            .insert(problemStatements);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Problem statements initialized',
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Register participant for CTF
app.post('/api/ctf/register', async (req, res) => {
    try {
        const { 
            name, 
            email, 
            phone, 
            year, 
            registrationNumber, 
            stream 
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !year || !registrationNumber || !stream) {
            throw new Error('All fields are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        // Validate phone number (10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            throw new Error('Invalid phone number format');
        }

        // Check if email or registration number already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('participants')
            .select('email, registration_number')
            .or(`email.eq.${email},registration_number.eq.${registrationNumber}`)
            .single();

        if (existingUser) {
            if (existingUser.email === email) {
                throw new Error('Email already registered');
            }
            if (existingUser.registration_number === registrationNumber) {
                throw new Error('Registration number already registered');
            }
        }

        // Register participant
        const { data, error } = await supabase
            .from('participants')
            .insert([{
                name,
                email,
                phone,
                year,
                registration_number: registrationNumber,
                stream
            }]);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Registration successful',
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 