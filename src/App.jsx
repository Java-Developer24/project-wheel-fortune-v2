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
              src="data:image/jpeg;base64,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"
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