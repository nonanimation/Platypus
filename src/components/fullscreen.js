/**
# COMPONENT **Fullscreen**
This component listens for "toggle-fullscreen" messages to toggle the game's container to full-screen and back.

Note: This component connects to the browser's fullscreen API if available. It also sets a "full-screen" class on the game container that should be styled in CSS for proper behavior.

## Dependencies:
- [[Render-Animation]] (component on entity) - This component listens for the "animation-complete" event triggered by RenderSprite.

## Messages:

### Listens for:
- **toggle-fullscreen** - On receiving this message, the component will go fullscreen if not already in fullscreen mode, and vice-versa.

## JSON Definition:
    {
      "type": "Fullscreen"
    }
*/

//TODO: Ideally this should be set up to work for any given element, not just the game container. - DDD

/*global platypus */
/*global Element */
(function () {
    "use strict";

    var enabled = false,
        element = null,
        turnOffFullScreen = function () {
            enabled = false;
            element.className = element.className.replace(/ full-screen/g, '');
            platypus.game.bindings.resize.callback();
        },
        toggleFullscreen = function () {
            if (enabled) {
                if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
                turnOffFullScreen();
            } else {
                enabled = true;
                element.className += ' full-screen';
                if (element.webkitRequestFullscreen) {
                    if (!platypus.supports.safari || platypus.supports.chrome) { //Safari doesn't allow all keyboard input in fullscreen which breaks game input - DDD 5/27/2013
                        element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                    }
                } else if (element.mozRequestFullScreen) {
                    element.mozRequestFullScreen();
                } else if (element.requestFullscreen) {
                    element.requestFullscreen(); // Opera
                }
                platypus.game.bindings.resize.callback();
            }
        };
    
    document.addEventListener('fullscreenchange', function (e) {
        if (!document.fullscreenElement) {
            turnOffFullScreen();
        }
    });
    document.addEventListener('webkitfullscreenchange', function (e) {
        if (!document.webkitFullscreenElement) {
            turnOffFullScreen();
        }
    });
    document.addEventListener('mozfullscreenchange', function (e) {
        if (!document.mozFullScreenElement) {
            turnOffFullScreen();
        }
    });
    
    return platypus.createComponentClass({
        id: 'Fullscreen',
        constructor: function (definition) {
            if (!element) {
                element = platypus.game.containerElement;
            }
        },
        events: {
            "toggle-fullscreen": toggleFullscreen
        }
    });
    
}());