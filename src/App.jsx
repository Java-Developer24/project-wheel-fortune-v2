import { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import { motion, AnimatePresence } from 'framer-motion';
import Dialog from '@mui/material/Dialog';
import guidesData from './data/guides.json';
import './App.css';

function App() {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [guideId, setGuideId] = useState('');
  const [currentPrizes, setCurrentPrizes] = useState([]);
  const [bucketPrizes, setBucketPrizes] = useState([]);
  const [showWheel, setShowWheel] = useState(false);
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [winningPrize, setWinningPrize] = useState('');
  const [currentGuide, setCurrentGuide] = useState(null);
  const [selectedPrize, setSelectedPrize] = useState(null);

  const wheelColors = ['#ffdf0e', '#9b59fb', '#eb7beb', '#b1ee31', '#2afcd5', '#20d087', '#3674B5'];
  const wheelData = currentPrizes.map((prize, index) => ({
    option: prize,
    style: {
      backgroundColor: wheelColors[index % wheelColors.length],
      textColor: '#000000',
      fontWeight: 'bold',
      textOrientation: 'vertical',
      textPosition: 'outer'
    }
  }));

  const sendPrizeEmail = async (guide, prize) => {
    const emailTemplate = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; text-align: center;">🎉 Congratulations on Your Prize! 🎉</h2>
            
            <p>Dear ${guide.name},</p>
            
            <p>We're excited to inform you that you've won a fantastic prize in our GoDaddy Wheel of Fortune game!</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #e74c3c; text-align: center;">Your Prize: ${prize}</h3>
            </div>
            
            <p>Prize Details:</p>
            <ul>
              <li>Prize Category: ${guide.bucket.toUpperCase()}</li>
              <li>Guide ID: ${guide.id}</li>
              <li>Date Won: ${new Date().toLocaleDateString()}</li>
            </ul>
            
            <p>To claim your prize, please contact the HR department with your Guide ID.</p>
            
            <p>Best regards,<br>GoDaddy Team</p>
          </div>
        </body>
      </html>
    `;

    try {
      const response = await fetch('https://project-wheel-backend.onrender.com/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: guide.email,
          cc: guide.cc,
          subject: '🎉 Congratulations on Your Prize!',
          html: emailTemplate
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Email sent successfully');
        console.log('Email preview URL:', data.previewUrl);
      } else {
        console.error('Failed to send email:', data.message);
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleSpinClick = () => {
    if (!currentGuide) {
      setShowDialog(true);
      return;
    }

    if (!mustSpin && selectedPrize !== null) {
      setPrizeNumber(selectedPrize);
      setMustSpin(true);
    }
  };

  const PlaceholderWheel = () => {
    return (
      <motion.div 
        className="wheel-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="placeholder-wheel-outer">
          <div className="placeholder-wheel">

          <motion.div 
                  className="wheel-center-animation"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                ></motion.div>
            <div className="placeholder-segments">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="segment"
                  style={{ transform: `rotate(${i * 60}deg)` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  
  
  const handleClaimPrize = () => {
    if (currentGuide && winningPrize) {
      sendPrizeEmail(currentGuide, winningPrize);
      console.log(`Prize claimed by ${currentGuide.name} (${currentGuide.id}): ${winningPrize}`);
    }
    
    setShowWinDialog(false);
    setMustSpin(false);
    setPrizeNumber(0);
    setBucketPrizes([]);
    setCurrentPrizes([]);
    setWinningPrize('');
    setGuideId('');
    setShowWheel(false);
    setCurrentGuide(null);
    setSelectedPrize(null);
  };
  
  const handleGuideIdSubmit = () => {
    const guide = guidesData.guides.find(g => g.id === guideId);
    
    if (guide) {
      console.log(`Guide ${guide.name} (${guide.id}) authenticated`);
      setCurrentGuide(guide);
      const bucket = guide.bucket;
      const allPrizes = guidesData.allPrizes;
      const userBucketPrizes = guidesData.prizes[bucket];
      
      const winningPrizeIndex = Math.floor(Math.random() * userBucketPrizes.length);
      console.log(`Winning prize index: ${winningPrizeIndex}`);
      const selectedPrize = userBucketPrizes[winningPrizeIndex];
      
      setCurrentPrizes(allPrizes);
      setBucketPrizes(userBucketPrizes);
      setShowDialog(false);
      setShowWheel(true);
      
      const prizeIndexInWheel = allPrizes.findIndex(prize => prize === selectedPrize);
      setSelectedPrize(prizeIndexInWheel);
      setWinningPrize(selectedPrize);
      
      console.log(`Selected prize bucket: ${bucket}`);
    } else {
      console.error(`Invalid Guide ID: ${guideId}`);
      alert('Invalid Guide ID');
    }
  };

  const handleSpinStop = () => {
    setMustSpin(false);
    createConfetti();
    console.log(`Wheel stopped - Prize won: ${winningPrize}`);
    setTimeout(() => {
      setShowWinDialog(true);
    }, 1000);
  };


  const createConfetti = () => {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    // Premium color palette
    const colors = [
      '#FFD700', // Gold
      '#E82561', // Brand Pink
      '#4A90E2', // Royal Blue
      '#50E3C2', // Turquoise
      '#F5A623', // Amber
      '#D0021B', // Ruby
      '#7ED321', // Emerald
    ];
    
    const shapes = ['star', 'circle', 'triangle', 'diamond'];
    const totalConfetti = 150;

    for (let i = 0; i < totalConfetti; i++) {
      const confetti = document.createElement('div');
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      confetti.className = `confetti ${shape}`;
      
      // Calculate random angle and distance for burst effect
      const angle = (Math.random() * 360) * (Math.PI / 180); // Convert to radians
      const velocity = 100 + Math.random() * 200; // Random velocity
      
      // Calculate final position based on angle
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;
      
      // Set custom properties for the animation
      confetti.style.setProperty('--tx', `${tx}px`);
      confetti.style.setProperty('--ty', `${ty}px`);
      
      // Randomize animation properties
      const animationDuration = 1 + Math.random() * 2;
      const animationDelay = Math.random() * 0.5;
      
      confetti.style.animation = `confetti-burst ${animationDuration}s ease-out forwards`;
      confetti.style.animationDelay = `${animationDelay}s`;
      
      // Random size
      const size = 8 + Math.random() * 12;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      
      // Random color
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      confettiContainer.appendChild(confetti);
    }

    // Remove the confetti container after animations complete
    setTimeout(() => {
      confettiContainer.remove();
    }, 4000);
  };
  
  
  return (
    <motion.div 
      className="app-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="decorative-circle circle-1"></div>
      <div className="decorative-circle circle-2"></div>
      
      <motion.div 
        className="wheel-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="trophy-icon">🏆</div>
        <motion.div 
          className="logo-container"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.div 
            className="logo-left-logo"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img 
              className="img-sizing" 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaqVGwXfboLlsa3uQAI8Yim-rx9MrsRYED-w&s" 
              alt="Left Logo" 
            />
          </motion.div>
          <motion.h1 
            className="lucky-spin-text"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Wheel OF Fortune
          </motion.h1>
          <motion.div 
            className="logo-right-logo"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img 
              className="img-sizing"
              src="../public/genpact.png"
              alt="Right Logo"
            />
          </motion.div>
        </motion.div>
        
        <div className="wheel-container">
          <div className="wheel-outer">
            <div className="wheel-ring-outer"></div>
            <div className="wheel-ring-middle"></div>
            <div className="wheel-ring-inner"></div>
            {!showWheel ? (
              <PlaceholderWheel />
            ) : currentPrizes.length > 0 ? (
              <motion.div 
                className="wheel-content"
                initial={{ rotate: 0 }}
                animate={{ rotate: mustSpin ? 1080 : 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={wheelData}
                  onStopSpinning={handleSpinStop}
                  outerBorderColor="#FFFFFF"
                  outerBorderWidth={3}
                  innerRadius={20}
                  radiusLineColor="black"
                  radiusLineWidth={1}
                  textDistance={85}
                  fontSize={15}
                  spinDuration={0.8}
                  perpendicularText={true}
                />
                <motion.div 
                  className="wheel-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                ></motion.div>
              </motion.div>
            ) : (
              <motion.div 
                className="mega-win"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Wheel <br/> OF <br/> Fortune
              </motion.div>
            )}
          </div>
        </div>

        <motion.button 
          className="spin-button" 
          onClick={handleSpinClick}
          disabled={mustSpin}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {currentGuide ? 'SPIN' : 'CLICK TO ENTER ID'}
        </motion.button>
      </motion.div>

      <Dialog 
        open={showDialog}
        onClose={() => setShowDialog(false)}
        PaperProps={{
          className: 'custom-dialog'
        }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="dialog-title">Enter Your Guide ID</div>
          <input
            type="text"
            className="custom-input"
            value={guideId}
            onChange={(e) => setGuideId(e.target.value)}
            placeholder="Enter ID"
          />
          <motion.button 
            className="dialog-button"
            onClick={handleGuideIdSubmit}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Go
          </motion.button>
        </motion.div>
      </Dialog>

      <AnimatePresence>
        <Dialog 
          open={showWinDialog}
          onClose={() => setShowWinDialog(false)}
          PaperProps={{
            className: 'custom-dialog'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="dialog-title">Congratulations! 🎉</div>
            <div style={{ textAlign: 'center' }}>
              <motion.h2 
                style={{ color: '#fff', marginBottom: '1rem' }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                You've Won:
              </motion.h2>
              <motion.h1 
                style={{ color: '#FFD700', fontSize: '2rem', marginBottom: '2rem' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                {winningPrize}
              </motion.h1>
              <motion.button 
                className="dialog-button"
                onClick={handleClaimPrize}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Claim Prize
              </motion.button>
            </div>
          </motion.div>
        </Dialog>
      </AnimatePresence>
    </motion.div>
  );
}

export default App;