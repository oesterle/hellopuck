var sleepTimeout = 20500;
var sleepTimeoutID = null;


var hi = {};

// when the battery is inserted, call powerOn()
// to load up everything
E.on('init', ()=> {
  powerOn();
});

// our routine to load up everything
var powerOn = ()=> {
  catchErrors();

  hi.animation = new Animation(); // RGB LED effects
  hi.movement = new Movement(); // monitor magnetometer
  hi.nearbyPucks = new NearbyPucks();

  NRF.nfcURL("https://puck-js.com/go");
  NRF.on('NFCon', nfcAction);

  hi.btn = new ToggleButton(demoStart, demoStop);
  hi.btn.isOn = true;
  demoStart();
};

// start the demo sequence
// (power on, again on button press)
var demoStart = ()=> {
  hello();
  checkLight();
  checkBattery();
  checkTemperature();
  hi.nearbyPucks.find();
  hi.animation.startRainbow(20000);
  hi.movement.start();
  startSleepTimer();
};

// stop the demo sequence
// (button pressed again)
var demoStop = ()=> {
  hi.animation.stopRainbow();
  hi.movement.stop();
};



// So, that's all there is!
//
// Actually, no. Here are the convenience methods and objects
// that make the above nice and simple.
//
//

var checkBattery = ()=> {
  var volts = Math.round(NRF.getBattery() * 100)/100;
  console.log("  Battery level\n    " + volts + " volts");
  if (volts < 2.7) {
    console.log("    * My battery is LOW.\n ");
  }
  return volts;
};

var checkTemperature = ()=> {
  var tempC = E.getTemperature();
  var tempFInt = Math.round(tempC * 9 / 5 + 32);
  tempCInt = Math.round(tempC);
  console.log("  Temperature is roughly\n    " + tempCInt + "\xC2\xB0 C (" + tempFInt + "\xC2\xB0 F)");
  return tempC;
};

var checkLight = ()=> {
  // workaround for 1.0v91
  digitalWrite(LED1,0);
  analogRead(LED1);
  var timeout = new Date().ms + 50; // 50ms
  while(new Date().ms < timeout);
  light = Math.max(0,analogRead(LED1) * NRF.getBattery() / (3 * 0.45));
  var lightPct = Math.round(light * 100);
  if (light < 20){
    console.log("  Seems pretty dark in here\n    " + lightPct + "% brightness");
  } else {
    console.log("  Seems bright in here\n    " + lightPct + "% brightness");
  }
  return light;
};

var nfcAction = ()=> {
  console.log("  NFC field detected!");
  hi.animation.startBlink();
};

var startSleepTimer = ()=> {
  should(()=>{clearTimeout(sleepTimeoutID);});
  sleepTimeoutID = setTimeout(()=>{
    sleepy();
    
    // reset toggle button state to off
    hi.btn.isOn = false;
  }, sleepTimeout);
};

var should = (fn)=>{
  try{fn();}catch(err){}
};

var hello = ()=> {
  var nnn = [
    " ",
    "    ________________",
    "   /                \\",
    "  /     |      @     \\",
    "  |     |___         |",
    "  |     |   \\  |     |",
    "  |     |   |  |     |",
    "  \\     |   |  |     /",
    "   \\________________/",
    "             ___",
    "            /   \\",
    "            \\___/",
    "           O",
    " "
  ];
  console.log(nnn.join('\n'));
};

var sleepy = ()=> {
  var nnn = [
    " ",
    "    ___________________",
    "   /                   \\",
    "  /              ZZZZZ  \\",
    "  |        zzzz     Z   |",
    "  |  ___     z     Z    |",
    "  |    /    z     Z     |",
    "  \\   /__  zzzz  ZZZZZ  /",
    "   \\___________________/",
    "             ___",
    "            /   \\",
    "            \\___/",
    "           O",
    " "
  ];
  console.log(nnn.join('\n'));
  console.log('  Resting for a bit.');
};

var catchErrors = ()=> {
  process.on('uncaughtException', function(someArgs){
    console.log("Uncaught exception: ");
    console.log(someArgs);
  });
};

///////////////////////////
//
//   Convenience Objects for Sensors and LEDs
//
///////////////////////////


// ToggleButton
//
// usage:
//
// var btn = new ToggleButton(onAction, offAction);
//
//    onAction: function to be called when button is pressed
//    offAction: function to be called when button is pressed again
//
// ToggleButton alternates between calling onAction and offAction, each
// time the button is pressed.
//

var ToggleButton = (onAction, offAction)=> {
  var t = this;
  t.isOn = false;

  t.turnOn = onAction;
  t.turnOff = offAction;

  var btnPress = ()=> {
    var newState = t.isOn ? "off" : "on";
    console.log("  Button pressed. Switching to " + newState + ".");
    if (t.isOn) {
      t.turnOff();
    } else {
      t.turnOn();
    }

    t.isOn = !(t.isOn);
  };

  var btnWatchID = setWatch(btnPress, BTN, {
    repeat: true,
    edge:'rising',
    debounce: 50
  });

  this.clear = () => {
    try{clearWatch(btnWatchID);}catch(err){}
  };
};


// NearbyPucks
//
// usage:
//
// var nearbyPucks = new NearbyPucks();
// nearbyPucks.find(doneCallback);
//
//    doneCallback: optional function to be called when devices are found:
//         function(names){};
//
//

var NearbyPucks = ()=> {
  var t = this;
  var ctr = 0;

  var devices = {};
  var findPucksTOID = null;

  t.foundCallback = null;

  t.find = (foundCallback)=> {
    t.foundCallback = foundCallback;
    devices = {};
    
    NRF.findDevices(t.foundDevices, 3000);
  };
  
  t.foundDevices = (allDevices)=>{
    allDevices.forEach((d)=>{
      var name = d.name || "";
      if (name.indexOf("Puck.js") > -1) {
        devices[name] = d;
      }
    });
    
    t.done();
  };
  
  t.done = ()=> {
    // NRF.setScan();
    var names = Object.keys(devices);
    
    if (names.length > 0){
      console.log("  I sense more friendly Pucks nearby!");
      for (var idx in names){
        console.log("    " + names[idx]);
      }
    } else {
      console.log("  I don't sense any other Pucks nearby.");
    }
    try{clearTimeout(findPucksTOID);} catch(err){}

    if (t.foundCallback) {
      t.foundCallback(names);
    }
  };
};

// Movement
//
// usage:
//
// var movement = new Movement(observerCallback);
//
//    observerCallback: optional function to be called when
//      changes to the magnetic field are sensed
//
//

var Movement = (observerCallback)=> {
  var t = this;

  var movementTimeout = 19000;
  var movementTimeoutID = null;
  var avr = null;
  var moved = false;
  var lastMoveMsg = "";

  t.observerCallback = observerCallback;

  t.start = ()=> {
    Puck.magOff();
    moved = false;
    lastMoveMsg = null;
    avr = null;
    movementTimeoutID = setTimeout(t.stop, movementTimeout);
    Puck.on('mag', check);
    Puck.magOn();
  };

  var check = (xyz)=> {
    var msg = "";
    if (avr === null) {
      avr = xyz;
    }
    var dx = xyz.x-avr.x;
    var dy = xyz.y-avr.y;
    var dz = xyz.z-avr.z;
    var magDiff = Math.sqrt(dx*dx+dy*dy+dz*dz);
    // update average
    avr.x += dx/2;
    avr.y += dy/2;
    avr.z += dz/2;
    if(magDiff > 100){
      // should do this just once
      if (!moved) {
        msg = "  I think I'm moving.";
        moved = true;
      }
    }
    if (dz < -500) {
      msg = "  I might be upside down!";
    }
    if (dz > 400) {
      msg = "  Oh, now I'm right side up.";
    }
    if (magDiff > 3000) {
      msg = "  I feel a magnet!";
    }
    if (msg != lastMoveMsg){
      console.log(lastMoveMsg = msg);
    }

    if (t.observerCallback){
      t.observerCallback({dx: dx, dy: dy, dz: dz});
    }
  };

  t.stop = ()=> {
    Puck.magOff();
    should(()=>{clearTimeout(movementTimeoutID);});
    moved = false;
  };

  t.init = ()=> {
    avr = Puck.mag();
  };

  t.init();
};


// Animation
//
// usage:
//
// var animation = new Animation();
// animation.startRainbow(); // starts rainbow for 20 seconds
//
// other methods:
//    animation.startBlink(); // starts blinking for 3 seconds
//    animation.stopRainbow(); // stops fade animation if running and cleans up
//
//


var Animation = ()=> {
  var fadeTO = 20000;
  var stepCt = 50;
  var fadeIntvl = 200;

  var t = this;

  var blinkTOID = null;
  var blinkIntvlID = null;
  var blinkOn = false;

  var fadeTOID = null;
  var fadeIntvlID = null;

  var step = 0;
  var isOn = false;

  var fadeColor = ()=> {
    var rgb = hueToRGB(step / stepCt);
    analogWrite(LED1, rgb.red * 0.25);
    analogWrite(LED2, rgb.green * 0.50);
    analogWrite(LED3, rgb.blue);
    step = (step + 1) % stepCt;
  };

  t.startBlink = ()=> {
    t.stopRainbow();
    should(()=>{clearInterval(blinkIntvlID);});
    should(()=>{clearTimeout(blinkTOID);});
    blinkTOID = setTimeout(()=> {
      should(()=>{clearInterval(blinkIntvlID);});
      should(()=>{clearTimeout(blinkTOID);});
      blinkTOID = null;
      digitalWrite([LED1,LED2,LED3],0);
    }, 3000);
    blinkIntvlID = setInterval(()=> {
      var LEDbitArray = blinkOn? 0b111 : 0b000;
      digitalWrite([LED1,LED2,LED3], LEDbitArray);
      blinkOn = !blinkOn;
    }, 100);
  };
  
  t.flash = ()=> {
    digitalWrite([LED1,LED2,LED3],0b111);
  };

  t.startRainbow = (duration, doneCallback)=> {
    fadeTO = duration || 20000;

    should(()=>{clearInterval(fadeIntvlID);});
    should(()=>{clearTimeout(fadeTOID);});
    console.log("  Starting up the rainbow!");
    step = 0;
    fadeIntvlID = setInterval(fadeColor, fadeIntvl);
    fadeTOID = setTimeout(()=> {
      t.stopRainbow(doneCallback);
    }, fadeTO);
    isOn = true;
  };

  t.stopRainbow = (doneCallback)=> {
    should(()=>{clearInterval(fadeIntvlID);});
    should(()=>{clearTimeout(fadeTOID);});
    digitalWrite([LED1,LED2,LED3],0);
    isOn = false;
    if (doneCallback){
      setTimeout(doneCallback, 100);
    }
  };

  var hueToRGB = (hue)=> {
    var rgb = {red:0,green:0,blue:0};
    var color = E.HSBtoRGB(hue,1,1);
    rgb.red = (color & 0xFF) / 255;
    rgb.green = (color >> 8 & 0xFF) / 255;
    rgb.blue = (color >> 16 & 0xFF) / 255;
    return rgb;
  };

  var should = (fn)=>{
    try{fn();}catch(err){}
  };
};
