# Hello, Puck!

Hello, Puck demonstrates many of the built-in features of Puck.js. Like Arduino, you can use Puck.js to build IoT devices. While you code Arduino in C++, Puck.js runs JavaScript. Like the Amazon Dash, you can program behaviors accessible with a single button click.

* Web Bluetooth IDE and console
* Button
* RGB LEDs
* Temperature sensor
* Battery sensor
* Magnetometer: 
  * movement
  * orientation
  * magnetism
* Nearby BLE devices
* Light sensor
* NFC URL broadcasting and field detection

# Video demo
30-second [video demo on Youtube](https://www.youtube.com/watch?v=EZPnjGKtMAk)

# Convenience objects and functions

There are a bunch of convenience objects and functions in here for simplifying using sensors and LEDs.

You can create two actions that happen on button press like this:
```
var toggleButton = new ToggleButton(startAction, stopAction);
```

You can do a 20-second fade through the colors of the rainbow with:
```
var animation = new Animation();
animation.startRainbow();
```

