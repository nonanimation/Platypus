/**
# COMPONENT **LogicRotationalMovement**
This component changes the (x, y) position of an object according to its current speed and heading. It maintains its own heading information independent of other components allowing it to be used simultaneously with other logic components like [[Logic-Pushable]]. It accepts directional messages that can stand alone, or come from a mapped controller, in which case it checks the `pressed` value of the message before changing its course accordingly.

## Dependencies:
- [[HandlerLogic]] (on entity's parent) - This component listens for a logic tick message to maintain and update its location.

## Messages

### Listens for:
- **handle-logic** - On a `tick` logic message, the component updates its location according to its current state.
  - @param message.delta - To determine how far to move the entity, the component checks the length of the tick.
- **[directional message]** - Directional messages include `turn-left`, `turn-right`, `go-forward`, and `go-backward`. On receiving one of these messages, the entity adjusts its movement and orientation.
  - @param message.pressed (boolean) - Optional. If `message` is included, the component checks the value of `pressed`: true causes movement in the triggered direction, false turns off movement in that direction. Note that if no message is included, the only way to stop movement in a particular direction is to trigger `stop` on the entity before progressing in a new orientation.
- **stop** - Stops rotational and linear motion movement messages are again received.
  - @param message.pressed (boolean) - Optional. If `message` is included, the component checks the value of `pressed`: a value of false will not stop the entity.
- **stop-turning** - Stops rotational motion until movement messages are again received.
  - @param message.pressed (boolean) - Optional. If `message` is included, the component checks the value of `pressed`: a value of false will not stop the entity.
- **stop-moving** - Stops linear motion until movement messages are again received.
  - @param message.pressed (boolean) - Optional. If `message` is included, the component checks the value of `pressed`: a value of false will not stop the entity.

## JSON Definition:
    {
      "type": "LogicRotationalMovement",
      
      "speed": 4.5,
      // Optional. Defines the distance in world units that the entity should be moved per millisecond. Defaults to 0.3.
      
      "angle": 0,
      // Optional: Radian orientation that entity should begin in. Defaults to 0 (facing right).
      
      "degree": 0.1
      // Optional: Unit in radian that the angle should change per millisecond.
    }
*/
/*global platypus */
(function () {
    'use strict';

    var cos = Math.cos,
        sin = Math.sin,
        polarToCartesianX = function (m, a) {
            return m * cos(a);
        },
        polarToCartesianY = function (m, a) {
            return m * sin(a);
        };
    
    return platypus.createComponentClass({
        id: 'LogicRotationalMovement',
        initialize: function (definition) {
            var state = this.owner.state;
            
            this.speed = definition.speed || 0.3;
            this.magnitude = 0;
            this.degree = definition.degree || 1;
            this.angle = definition.angle || 0;
            
            this.state = state;
            state.set('moving', false);
            state.set('turningRight', false);
            state.set('turningLeft', false);
    
            this.owner.orientation  = 0;
            
            this.moving = false;
            this.turningRight = false;
            this.turningLeft = false;
        },
        events: {
            "handle-logic": function (resp) {
                var state = this.state,
                    vX = 0,
                    vY = 0;
                
                if (this.turningRight) {
                    this.angle += this.degree * resp.delta / 15;
                }
        
                if (this.turningLeft) {
                    this.angle -= this.degree * resp.delta / 15;
                }
                
                if (this.moving) {
                    vX = polarToCartesianX(this.magnitude, this.angle);
                    vY = polarToCartesianY(this.magnitude, this.angle);
                }
        
                this.owner.x += (vX * resp.delta);
                this.owner.y += (vY * resp.delta);
                
                state.set('moving', this.moving);
                state.set('turningLeft', this.turningLeft);
                state.set('turningRight', this.turningRight);
                
                if (this.owner.rotation !== this.angle) {
                    this.owner.rotation = this.angle;
                }
            },
            "turn-right": function (state) {
                if (state) {
                    this.turningRight = state.pressed;
                } else {
                    this.turningRight = true;
                }
            },
            "turn-left": function (state) {
                if (state) {
                    this.turningLeft = state.pressed;
                } else {
                    this.turningLeft = true;
                }
            },
            "go-forward": function (state) {
                if (!state || state.pressed) {
                    this.moving = true;
                    this.magnitude = this.speed;
                } else {
                    this.moving = false;
                }
            },
            "go-backward": function (state) {
                if (!state || state.pressed) {
                    this.moving = true;
                    this.magnitude = -this.speed;
                } else {
                    this.moving = false;
                }
            },
            "stop": function (state) {
                if (!state || state.pressed) {
                    this.moving = false;
                    this.turningLeft = false;
                    this.turningRight = false;
                }
            },
            "stop-moving": function (state) {
                if (!state || state.pressed) {
                    this.moving = false;
                }
            },
            "stop-turning": function (state) {
                if (!state || state.pressed) {
                    this.turningLeft = false;
                    this.turningRight = false;
                }
            }
        },
        
        methods: {
            destroy: function () {
                this.state = null;
            }
        }
    });
}());
