/**
 * This component groups other entities with this entity for collision checking. This is useful for carrying and moving platforms. It uses `EntityContainer` component messages if triggered to add to its collision list and also listens for explicit add/remove messages (useful in the absence of an `EntityContainer` component).
 * 
 * @namespace platypus.components
 * @class CollisionGroup
 * @uses Component
 */
/*global platypus */
/*jslint plusplus:true */
(function () {
    "use strict";

    //set here to make them reusable objects
    var appendUniqueItems = function (hostArray, insertArray) {
        var i      = 0,
            j      = 0,
            length = hostArray.length,
            found  = false;
        
        for (i = 0; i < insertArray.length; i++) {
            found = false;
            for (j = 0; j < length; j++) {
                if (insertArray[i] === hostArray[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                hostArray.push(insertArray[i]);
            }
        }
        
        return hostArray;
    };
    
    return platypus.createComponentClass({
        id: 'CollisionGroup',
        
        constructor: function (definition) {
            var self = this;
            
            this.solidEntities = [];
            
            this.terrain = undefined;
            this.aabb     = new platypus.AABB(this.owner.x, this.owner.y);
            this.prevAABB = new platypus.AABB(this.owner.x, this.owner.y);

            platypus.Vector.assign(this.owner, 'position', 'x', 'y', 'z');
            platypus.Vector.assign(this.owner, 'previousPosition', 'previousX', 'previousY', 'previousZ');
            this.owner.previousX = this.owner.previousX || this.owner.x;
            this.owner.previousY = this.owner.previousY || this.owner.y;
            
            this.collisionGroup = this.owner.collisionGroup = {
                getAllEntities: function () {
                    var x           = 0,
                        count       = 0,
                        childEntity = null;
                    
                    for (x = 0; x < self.solidEntities.length; x++) {
                        childEntity = self.solidEntities[x];
                        if ((childEntity !== self.owner) && childEntity.collisionGroup) {
                            count += childEntity.collisionGroup.getAllEntities();
                        } else {
                            count += 1;
                        }
                    }

                    return count;
                },
                getSize: function () {
                    return self.solidEntities.length;
                },
                getCollisionTypes: function () {
                    return self.getCollisionTypes();
                },
                getSolidCollisions: function () {
                    return self.getSolidCollisions();
                },
                getAABB: function (collisionType) {
                    return self.getAABB(collisionType);
                },
                getPreviousAABB: function (collisionType) {
                    return self.getPreviousAABB(collisionType);
                },
                getShapes: function (collisionType) {
                    return self.getShapes(collisionType);
                },
                getPrevShapes: function (collisionType) {
                    return self.getPrevShapes(collisionType);
                },
                prepareCollision: function (x, y) {
                    return self.prepareCollision(x, y);
                },
                relocateEntity: function (vector, collisionData) {
                    return self.relocateEntity(vector, collisionData);
                },
                movePreviousX: function (x) {
                    return self.movePreviousX(x);
                },
                getSolidEntities: function () {
                    return self.solidEntities;
                },
                jumpThrough: false //TODO: this introduces odd behavior - not sure how to resolve yet. - DDD
            };
        },
        
        events: {
            /**
             * On receiving this message, the component checks the entity to determine whether it listens for collision messages. If so, the entity is added to the collision group.
             * 
             * @method 'child-entity-added'
             * @param entity {Entity} The entity to be added.
             */
            "child-entity-added": function (entity) {
                this.addCollisionEntity(entity);
            },
            
            /**
             * On receiving this message, the component checks the entity to determine whether it listens for collision messages. If so, the entity is added to the collision group.
             * 
             * @method 'add-collision-entity'
             * @param entity {Entity} The entity to be added.
             */
            "add-collision-entity": function (entity) {
                this.addCollisionEntity(entity);
            },
            
            /**
             * On receiving this message, the component looks for the entity in its collision group and removes it.
             * 
             * @method 'child-entity-removed'
             * @param entity {Entity} The entity to be removed.
             */
            "child-entity-removed": function (entity) {
                this.removeCollisionEntity(entity);
            },
            
            /**
             * On receiving this message, the component looks for the entity in its collision group and removes it.
             * 
             * @method 'remove-collision-entity'
             * @param entity {Entity} The entity to be removed.
             */
            "remove-collision-entity": function (entity) {
                this.removeCollisionEntity(entity);
            },
            
            /**
             * When this message is triggered, the collision group updates its record of the owner's last (x, y) coordinate.
             * 
             * @method 'relocate-entity'
             */
            "relocate-entity": function () {
                this.owner.previousPosition.set(this.owner.position);
                this.updateAABB();
            }
        },
        
        methods: {
            addCollisionEntity: function (entity) {
                var i     = 0,
                    types = entity.collisionTypes;
                
                if (types) {
                    for (i = 0; i < types.length; i++) {
                        if (entity.solidCollisions[types[i]].length && !entity.immobile) {
                            this.solidEntities[this.solidEntities.length] = entity;
                        }
                    }
                    this.updateAABB();
                }
            },
            
            removeCollisionEntity: function (entity) {
                var x     = 0,
                    i     = 0,
                    types = entity.collisionTypes;

                if (types) {
                    for (i = 0; i < types.length; i++) {
                        if (entity.solidCollisions[types[i]].length) {
                            for (x in this.solidEntities) {
                                if (this.solidEntities[x] === entity) {
                                    this.solidEntities.splice(x, 1);
                                    break;
                                }
                            }
                        }
                    }
                    this.updateAABB();
                }
            },
            
            getCollisionTypes: function () {
                var x            = 0,
                    childEntity  = null,
                    compiledList = [];
                
                for (x = 0; x < this.solidEntities.length; x++) {
                    childEntity = this.solidEntities[x];
                    if ((childEntity !== this.owner) && childEntity.collisionGroup) {
                        childEntity = childEntity.collisionGroup;
                    }
                    compiledList = appendUniqueItems(compiledList, childEntity.getCollisionTypes());
                }
                
                return compiledList;
            },

            getSolidCollisions: function () {
                var x            = 0,
                    key          = '',
                    childEntity  = null,
                    compiledList = {},
                    entityList   = null;
                
                for (x = 0; x < this.solidEntities.length; x++) {
                    childEntity = this.solidEntities[x];
                    if ((childEntity !== this.owner) && childEntity.collisionGroup) {
                        childEntity = childEntity.collisionGroup;
                    }
                    entityList = childEntity.getSolidCollisions();
                    for (key in entityList) {
                        if (entityList.hasOwnProperty(key)) {
                            compiledList[key] = appendUniqueItems(compiledList[key] || [], entityList[key]);
                        }
                    }
                }
                
                return compiledList;
            },
            
            getAABB: function (collisionType) {
                var x           = 0,
                    aabb        = null,
                    childEntity = null;
                
                if (!collisionType) {
                    return this.aabb;
                } else {
                    aabb = new platypus.AABB();
                    for (x = 0; x < this.solidEntities.length; x++) {
                        childEntity = this.solidEntities[x];
                        if ((childEntity !== this.owner) && childEntity.collisionGroup) {
                            childEntity = childEntity.collisionGroup;
                        }
                        
                        aabb.include(childEntity.getAABB(collisionType));
                    }
                    return aabb;
                }
            },

            getPreviousAABB: function (collisionType) {
                var x           = 0,
                    aabb        = null,
                    childEntity = null;
                
                if (!collisionType) {
                    return this.prevAABB;
                } else {
                    aabb = new platypus.AABB();
                    for (x = 0; x < this.solidEntities.length; x++) {
                        childEntity = this.solidEntities[x];
                        if ((childEntity !== this.owner) && childEntity.collisionGroup) {
                            childEntity = childEntity.collisionGroup;
                        }

                        aabb.include(childEntity.getPreviousAABB(collisionType));
                    }
                    return aabb;
                }
            },
            
            updateAABB: function () {
                var x = 0;
                
                this.aabb.reset();
                for (x = 0; x < this.solidEntities.length; x++) {
                    this.aabb.include(((this.solidEntities[x] !== this.owner) && this.solidEntities[x].getCollisionGroupAABB) ? this.solidEntities[x].getCollisionGroupAABB() : this.solidEntities[x].getAABB());
                }
            },
            
            getShapes: function (collisionType) {
                var x           = 0,
                    childEntity = null,
                    shapes      = [],
                    newShapes   = null;
                
                for (x = 0; x < this.solidEntities.length; x++) {
                    childEntity = this.solidEntities[x];
                    if ((childEntity !== this.owner) && childEntity.collisionGroup) {
                        childEntity = childEntity.collisionGroup;
                    }
                    newShapes = childEntity.getShapes(collisionType);
                    if (newShapes) {
                        shapes = shapes.concat(newShapes);
                    }
                }
                return shapes;
            },

            getPrevShapes: function (collisionType) {
                var x           = 0,
                    childEntity = null,
                    newShapes   = null,
                    shapes      = [];
                
                for (x = 0; x < this.solidEntities.length; x++) {
                    childEntity = this.solidEntities[x];
                    if ((childEntity !== this.owner) && childEntity.collisionGroup) {
                        childEntity = childEntity.collisionGroup;
                    }
                    newShapes = childEntity.getPrevShapes(collisionType);
                    if (newShapes) {
                        shapes = shapes.concat(newShapes);
                    }
                }
                return shapes;
            },
            
            prepareCollision: function (x, y) {
                var i           = 0,
                    childEntity = null,
                    oX          = 0,
                    oY          = 0;
                
                for (i = 0; i < this.solidEntities.length; i++) {
                    childEntity = this.solidEntities[i];
                    childEntity.saveDX = childEntity.x - childEntity.previousX;
                    childEntity.saveDY = childEntity.y - childEntity.previousY;
                    oX = childEntity.saveOX = this.owner.previousX - childEntity.previousX;
                    oY = childEntity.saveOY = this.owner.previousY - childEntity.previousY;
                    if ((childEntity !== this.owner) && childEntity.collisionGroup) {
                        childEntity = childEntity.collisionGroup;
                    }
                    childEntity.prepareCollision(x - oX, y - oY);
                }
            },
            
            movePreviousX: function (x) {
                var childEntity = null,
                    offset      = 0,
                    i           = 0;
                
                for (i = 0; i < this.solidEntities.length; i++) {
                    childEntity = this.solidEntities[i];
                    offset = childEntity.saveOX;
                    if ((childEntity !== this.owner) && childEntity.collisionGroup) {
                        childEntity = childEntity.collisionGroup;
                    }
                    childEntity.movePreviousX(x - offset);
                }
            },
            
            relocateEntity: function (vector, collisionData) {
                var childEntity = null,
                    entity      = null,
                    i           = 0;
                
                this.owner.saveDX -= vector.x - this.owner.previousX;
                this.owner.saveDY -= vector.y - this.owner.previousY;

                for (i = 0; i < collisionData.xCount; i++) {
                    if (collisionData.getXEntry(i).thisShape.owner === this.owner) {
                        this.owner.saveDX = 0;
                        break;
                    }
                }
                
                for (i = 0; i < collisionData.yCount; i++) {
                    if (collisionData.getYEntry(i).thisShape.owner === this.owner) {
                        this.owner.saveDY = 0;
                        break;
                    }
                }
                
                for (i = 0; i < this.solidEntities.length; i++) {
                    childEntity = entity = this.solidEntities[i];
                    if ((childEntity !== this.owner) && childEntity.collisionGroup) {
                        childEntity = childEntity.collisionGroup;
                    }
                    childEntity.relocateEntity(new platypus.Vector(vector.x - entity.saveOX, vector.y - entity.saveOY), collisionData);
                    entity.x += entity.saveDX;
                    entity.y += entity.saveDY;
                    if (entity !== this.owner) {
                        entity.x += this.owner.saveDX;
                        entity.y += this.owner.saveDY;
                    }
                }
            },

            destroy: function () {
                this.solidEntities.length = 0;
            }
        },
        
        publicMethods: {
            /**
             * Gets the bounding box of the group of entities.
             * 
             * @method getCollisionGroupAABB
             * @return platformer.AABB
             */
            getCollisionGroupAABB: function () {
                return this.getAABB();
            },
            
            /**
             * Gets a list of all the entities in the world.
             * 
             * @method getWorldEntities
             * @return Array
             */
            getWorldEntities: function () {
                return this.owner.parent.getWorldEntities();
            },
            
            /**
             * Gets the collision entity representing the world's terrain.
             * 
             * @method getWorldTerrain
             * @return platformer.Entity
             */
            getWorldTerrain: function () {
                return this.owner.parent.getWorldTerrain();
            }
        }
    });
}());