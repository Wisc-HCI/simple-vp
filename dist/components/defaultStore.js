"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProgrammingSlice = exports.ImmerProgrammingSlice = void 0;
exports.deleteChildren = deleteChildren;
exports.deleteFromChildren = deleteFromChildren;
exports.deleteFromProgram = deleteFromProgram;
exports.deleteSelfBlock = deleteSelfBlock;
exports.move = move;
exports.useDefaultProgrammingStore = void 0;

var _zustand = _interopRequireDefault(require("zustand"));

var _immer = _interopRequireDefault(require("immer"));

var _uuid = require("uuid");

var _ = require(".");

var _lodash = require("lodash");

var _Generators = require("./Generators");

var _Timer = require("./Timer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var randInt8 = function randInt8() {
  return Math.floor(Math.random() * 256);
};

var randomColor = function randomColor() {
  return "rgb(".concat(randInt8(), ",").concat(randInt8(), ",").concat(randInt8(), ")");
};

var DEFAULT_PROGRAM_SPEC = {
  drawers: [],
  objectTypes: {}
};

var generateUuid = function generateUuid(type) {
  return "".concat(type, "-").concat((0, _uuid.v4)());
}; // Credit: https://www.npmjs.com/package/lodash-move


function move(array, moveIndex, toIndex) {
  /* #move - Moves an array item from one position in an array to another.
     Note: This is a pure function so a new array will be returned, instead
     of altering the array argument.
    Arguments:
    1. array     (String) : Array in which to move an item.         (required)
    2. moveIndex (Object) : The index of the item to move.          (required)
    3. toIndex   (Object) : The index to move item at moveIndex to. (required)
  */
  var item = array[moveIndex];
  var length = array.length;
  var diff = moveIndex - toIndex;

  if (diff > 0) {
    // move left
    return [].concat(_toConsumableArray(array.slice(0, toIndex)), [item], _toConsumableArray(array.slice(toIndex, moveIndex)), _toConsumableArray(array.slice(moveIndex + 1, length)));
  } else if (diff < 0) {
    // move right
    var targetIndex = toIndex + 1;
    return [].concat(_toConsumableArray(array.slice(0, moveIndex)), _toConsumableArray(array.slice(moveIndex + 1, targetIndex)), [item], _toConsumableArray(array.slice(targetIndex, length)));
  }

  return array;
}

var pruneEdgesFromBlock = function pruneEdgesFromBlock(state, blockId) {
  state.programData = (0, _lodash.omitBy)(state.programData, function (data) {
    if (data.dataType === _.DATA_TYPES.CONNECTION && (data.parent.id === blockId || data.child.id === blockId)) {
      return true;
    } else {
      return false;
    }
  });
  return state;
};

function deleteFromChildren(state, idsToDelete, parentData) {
  // Corner case for call blocks (don't look at parent's information)
  if (parentData.dataType === _.DATA_TYPES.CALL) {
    var _Object$keys;

    (_Object$keys = Object.keys(parentData.properties)) === null || _Object$keys === void 0 ? void 0 : _Object$keys.forEach(function (propName) {
      var _state$programData$pa;

      if (idsToDelete.includes((_state$programData$pa = state.programData[parentData.properties[propName]]) === null || _state$programData$pa === void 0 ? void 0 : _state$programData$pa.ref)) {
        delete state.programData[parentData.properties[propName]];
        state.programData[parentData.id].properties[propName] = null;
        state = pruneEdgesFromBlock(state, parentData.properties[propName]);
      }
    });

    for (var i = 0; i < idsToDelete.length; i++) {
      delete state.programData[parentData.id].properties[idsToDelete[i]];
    }
  } else {
    var _state$programSpec$ob;

    // Clear children and properties (if applicable)
    if ((_state$programSpec$ob = state.programSpec.objectTypes[parentData.type]) !== null && _state$programSpec$ob !== void 0 && _state$programSpec$ob.properties) {
      Object.keys(state.programSpec.objectTypes[parentData.type].properties).forEach(function (propName) {
        if (propName) {
          var _state$programData$pa2;

          var property = state.programSpec.objectTypes[parentData.type].properties[propName]; // Clearing child fields/references

          if (property && (property.type || property.type === _.TYPES.OBJECT)) {// Ignore SIMPLE types.
          } else if (property && property.isList) {
            parentData.properties[propName].forEach(function (child) {
              state = deleteFromChildren(state, idsToDelete, state.programData[child]);
            });
            idsToDelete.forEach(function (idToDelete) {
              var newList = state.programData[parentData.id].properties[propName].filter(function (field) {
                var _state$programData$fi;

                return ((_state$programData$fi = state.programData[field]) === null || _state$programData$fi === void 0 ? void 0 : _state$programData$fi.ref) !== idToDelete;
              });
              state.programData[parentData.id].properties[propName] = newList;
            });
          } else if (property && parentData.properties[propName] && idsToDelete.includes((_state$programData$pa2 = state.programData[parentData.properties[propName]]) === null || _state$programData$pa2 === void 0 ? void 0 : _state$programData$pa2.ref)) {
            // Delete Reference to Child
            delete state.programData[parentData.properties[propName]]; // entry.properties[propName] = null;

            state.programData[parentData.id].properties[propName] = null;
            state = pruneEdgesFromBlock(state, parentData.properties[propName]);
          }
        }
      });
    }
  }

  return state;
}

function deleteFromProgram(state, idsToDelete) {
  var searches = (0, _lodash.pickBy)(state.programData, function (entry) {
    return entry.dataType === _.DATA_TYPES.INSTANCE;
  }); // Search through all instances for occurances of the ids we're deleting

  Object.keys(searches).forEach(function (entry) {
    if (state.programData[entry]) {
      state = deleteFromChildren(state, idsToDelete, state.programData[entry]);
    }
  });
  return state;
}

function deleteSelfBlock(state, data, parentId, fieldInfo) {
  var _data$typeSpec;

  if (((_data$typeSpec = data.typeSpec) === null || _data$typeSpec === void 0 ? void 0 : _data$typeSpec.type) === _.TYPES.FUNCTION) {
    // Find all references to the function
    var callReferences = (0, _lodash.pickBy)(state.programData, function (entry) {
      return entry.dataType === _.DATA_TYPES.CALL && entry.refData.id === data.id;
    });
    var callIds = Object.keys(callReferences); // Delete the children from the function calls

    callIds.forEach(function (cID) {
      state = deleteChildren(state, state.programData[cID], parentId, fieldInfo);
    }); // Clear function arguments if function

    if (data.arguments) {
      data.arguments.forEach(function (argumentId) {
        delete state.programData[argumentId];
        state = pruneEdgesFromBlock(state, argumentId);
      });
    } // Find the parent's of the references, and remove the references from them


    Object.keys(state.programData).forEach(function (entryId) {
      var _state$programSpec$ob2;

      var entry = state.programData[entryId];

      if ((_state$programSpec$ob2 = state.programSpec.objectTypes[entry.type]) !== null && _state$programSpec$ob2 !== void 0 && _state$programSpec$ob2.properties) {
        // Iterate through properties
        Object.keys(state.programSpec.objectTypes[entry.type].properties).forEach(function (propName) {
          if (propName) {
            var property = state.programSpec.objectTypes[entry.type].properties[propName];

            if (property && (property.type || property.type === _.TYPES.OBJECT)) {// Ignore SIMPLE types.
            } else if (property && property.isList) {
              var _loop = function _loop(i) {
                var _entry$properties$pro;

                if ((_entry$properties$pro = entry.properties[propName]) !== null && _entry$properties$pro !== void 0 && _entry$properties$pro.includes(callIds[i])) {
                  (0, _lodash.remove)(state.programData[entryId].properties[propName], function (field) {
                    return field === callIds[i];
                  });
                }
              };

              // Iterate through property list and remove all applicable references
              for (var i = 0; i < callIds.length; i++) {
                _loop(i);
              }
            } else if (property && entry.properties[propName]) {
              // Delete reference from property
              if (callIds.includes(entry.properties[propName])) {
                entry.properties[propName] = null;
                state.programData[entryId].properties[propName] = null;
              }
            }
          }
        });
      }
    }); // Delete the reference and any children

    callIds.forEach(function (reference) {
      state = deleteChildren(state, state.programData[reference]);
      delete state.programData[reference];
      state = pruneEdgesFromBlock(state, reference);
    });
  } else if (fieldInfo !== null && fieldInfo !== void 0 && fieldInfo.isSpawner) {
    if (parentId === "spawner") {
      // Drawer deletion
      state = deleteFromProgram(state, [data.ref]);
      delete state.programData[data.ref];
      state = pruneEdgesFromBlock(state, data.ref);
    } else {
      var _state$programData$pa3;

      // Argument deletion
      state = deleteFromChildren(state, [data.ref], state.programData[parentId]); // Remove argument from function

      if ((_state$programData$pa3 = state.programData[parentId]) !== null && _state$programData$pa3 !== void 0 && _state$programData$pa3.arguments) {
        var _state$programData$pa4;

        (0, _lodash.remove)((_state$programData$pa4 = state.programData[parentId]) === null || _state$programData$pa4 === void 0 ? void 0 : _state$programData$pa4.arguments, function (field) {
          return field === data.ref;
        });
      }
    }
  } // Remove self from state


  delete state.programData[data.id];
  state = pruneEdgesFromBlock(state, data.id);
  return state;
}

function deleteChildren(state, data, parentId, fieldInfo) {
  // Clear children and properties (if applicable)
  if (data.dataType === _.DATA_TYPES.CALL) {
    state.programData[data.ref].arguments.forEach(function (argument) {
      if (data.properties[argument] && state.programData[data.properties[argument]]) {
        state = deleteSelfBlock(state, state.programData[data.properties[argument]], parentId, fieldInfo);
      }
    });
  } else if (data.dataType !== _.DATA_TYPES.REFERENCE && state.programSpec.objectTypes[data.type].properties) {
    Object.keys(state.programSpec.objectTypes[data.type].properties).forEach(function (propName) {
      if (propName) {
        var property = state.programSpec.objectTypes[data.type].properties[propName]; // Clearing child fields/references

        if (property && (property.type || property.type === _.TYPES.OBJECT)) {// Ignore SIMPLE types.
        } else if (property && property.isList) {
          // Iterate over list and remove each entry (probably recursively)
          if (data.properties[propName]) {
            data.properties[propName].forEach(function (child) {
              // Recursively delete children
              state = deleteChildren(state, state.programData[child], parentId, fieldInfo);
              state = deleteSelfBlock(state, state.programData[child], parentId, fieldInfo);
            });
          }
        } else if (property && data.properties[propName]) {
          // Delete Reference to Child
          state = deleteChildren(state, state.programData[data.properties[propName]], parentId, fieldInfo);
          state = deleteSelfBlock(state, state.programData[data.properties[propName]], parentId, fieldInfo);
        }
      }
    });
  }

  return state;
}

var immer = function immer(config) {
  return function (set, get, api) {
    return config(function (partial, replace) {
      var nextState = typeof partial === "function" ? (0, _immer.default)(partial) : partial;
      return set(nextState, replace);
    }, get, api);
  };
};

var ProgrammingSlice = function ProgrammingSlice(set, get) {
  return {
    locked: false,
    setLocked: function setLocked(locked) {
      return set({
        locked: locked
      });
    },
    activeDrawer: null,
    connectionInfo: null,
    setConnectionInfo: function setConnectionInfo(info) {
      return set({
        connectionInfo: info
      });
    },
    setActiveDrawer: function setActiveDrawer(activeDrawer) {
      return set({
        activeDrawer: activeDrawer
      });
    },
    programSpec: DEFAULT_PROGRAM_SPEC,
    programData: {},
    executionData: {},
    transferBlock: function transferBlock(data, sourceInfo, destInfo) {
      set(function (state) {
        var _sourceInfo$fieldInfo;

        var newSpawn = false;
        var id = data.id;

        if (!state.programData[data.id]) {
          // Clone the data with a new id
          id = generateUuid(data.type);
          state.programData[id] = _objectSpread(_objectSpread({}, data), {}, {
            id: id
          });
          newSpawn = true;
        }

        var sourceIsList = (_sourceInfo$fieldInfo = sourceInfo.fieldInfo) === null || _sourceInfo$fieldInfo === void 0 ? void 0 : _sourceInfo$fieldInfo.isList;
        var destIsList = destInfo.fieldInfo.isList; // If both source and dest are the same list, handle this specially

        if (destIsList && sourceIsList && sourceInfo.parentId === destInfo.parentId) {
          state.programData[destInfo.parentId].properties[destInfo.fieldInfo.value] = move(state.programData[destInfo.parentId].properties[destInfo.fieldInfo.value], sourceInfo.idx, destInfo.idx);
        } else {
          // Place the value in its new location
          if (destIsList) {
            state.programData[destInfo.parentId].properties[destInfo.fieldInfo.value].splice(destInfo.idx, 0, id);
          } else {
            state.programData[destInfo.parentId].properties[destInfo.fieldInfo.value] = id;
          } // If existing, remove from the previous location


          if (!newSpawn && sourceInfo.parentId === destInfo.parentId && sourceInfo.fieldInfo === destInfo.fieldInfo) {// ignore if dropped in the source
          } else if (!newSpawn && sourceIsList) {
            // Insert at the right location
            state.programData[sourceInfo.parentId].properties[destInfo.fieldInfo.value].splice(sourceInfo.idx, 1);
          } else if (!newSpawn && !sourceIsList) {
            console.log("removing from previous by setting to null");
            state.programData[sourceInfo.parentId].properties[sourceInfo.fieldInfo.value] = null;
          }
        }
      });
    },
    moveBlocks: function moveBlocks(changes) {
      return set(function (state) {
        changes.forEach(function (change) {
          if (change.type === "position" && state.programData[change.id] && change.position) {
            state.programData[change.id].position = change.position;
          }
        });
      });
    },
    deleteBlock: function deleteBlock(data, parentId, fieldInfo) {
      set(function (state) {
        // Delete block's children and parameters
        state = deleteChildren(state, data, parentId, fieldInfo); // Delete current block

        state = deleteSelfBlock(state, data, parentId, fieldInfo); // Clear parent properties

        if (parentId !== "spawner") {
          if (parentId && fieldInfo && !fieldInfo.isList) {
            // Clear parent's field value (to null)
            state.programData[parentId].properties[fieldInfo.value] = null;
          } else if (parentId && fieldInfo && fieldInfo.isList) {
            // Erase self from the parent's list
            (0, _lodash.remove)(state.programData[parentId].properties[fieldInfo.value], function (entry) {
              return entry === data.id;
            });
          }
        }
      });
    },
    createPlacedBlock: function createPlacedBlock(data, x, y) {
      set(function (state) {
        var id = data.id;

        if (!state.programData[data.id]) {
          // Clone the data with a new id
          id = generateUuid(data.type);
          state.programData[id] = _objectSpread(_objectSpread({}, data), {}, {
            id: id
          });
        }

        state.programData[id].position = {
          x: x,
          y: y
        };
      });
    },
    addInstance: function addInstance(instanceType) {
      set(function (state) {
        var id = generateUuid(instanceType);

        var template = _objectSpread(_objectSpread({}, (0, _Generators.instanceTemplateFromSpec)(instanceType, state.programSpec.objectTypes[instanceType], false)), {}, {
          id: id,
          dataType: _.DATA_TYPES.INSTANCE
        });

        state.programData[id] = template;
      });
    },
    addArgument: function addArgument(parentFunctionId, argumentType) {
      set(function (state) {
        var id = generateUuid(argumentType);

        var template = _objectSpread(_objectSpread({}, (0, _Generators.instanceTemplateFromSpec)(argumentType, state.programSpec.objectTypes[argumentType], true)), {}, {
          id: id,
          dataType: _.DATA_TYPES.ARGUMENT
        });

        state.programData[id] = template;
        state.programData[parentFunctionId].arguments.push(id);
      });
    },
    updateItemName: function updateItemName(id, value) {
      set(function (state) {
        var item = state.programData[id];
        var usedId = item.dataType === _.DATA_TYPES.REFERENCE || item.dataType === _.DATA_TYPES.CALL ? item.ref : id;
        state.programData[usedId].name = value;
      });
    },
    updateItemSelected: function updateItemSelected(id, value) {
      set(function (state) {
        var item = state.programData[id];
        var usedId = item.dataType === _.DATA_TYPES.REFERENCE || item.dataType === _.DATA_TYPES.CALL ? item.ref : id;
        state.programData[usedId].selected = value;
      });
    },
    updateItemEditing: function updateItemEditing(id, value) {
      set(function (state) {
        state.programData[id].editing = value;
      });
    },
    updateItemSimpleProperty: function updateItemSimpleProperty(id, property, value) {
      set(function (state) {
        state.programData[id].properties[property] = value;
      });
    },
    updateEdgeName: function updateEdgeName(id, value) {
      set(function (state) {
        state.programData[id].name = value;
      });
    },
    deleteEdge: function deleteEdge(id) {
      set(function (state) {
        delete state.programData[id];
      });
    },
    createEdge: function createEdge(source, sourceHandle, target, targetHandle) {
      set(function (state) {
        // console.log("createEdge", { source, sourceHandle, target, targetHandle });
        var edgeCount = Object.values(state.programData).filter(function (d) {
          return d.dataType === _.DATA_TYPES.CONNECTION;
        }).length;
        var newEdge = {
          id: generateUuid("edge"),
          name: "Connection ".concat(edgeCount + 1),
          dataType: _.DATA_TYPES.CONNECTION,
          parent: {
            id: source,
            handle: sourceHandle
          },
          child: {
            id: target,
            handle: targetHandle
          },
          mode: _.SIMPLE_PROPERTY_TYPES.STRING
        };
        state.programData[newEdge.id] = newEdge; // console.log('createEdge',{source,sourceHandle,target,targetHandle})
      });
    },
    validateEdge: function validateEdge(source, sourceHandle, target, targetHandle) {
      // console.log("validateEdge", { source, sourceHandle, target, targetHandle });
      if (source === target) {
        return false;
      }

      var edges = Object.values(get().programData).filter(function (d) {
        return d.dataType === _.DATA_TYPES.CONNECTION;
      });
      var sourceNode = get().programData[source];
      var sourceTypeInfo = get().programSpec.objectTypes[sourceNode.type]; // console.log(sourceTypeInfo);

      var sourceConnectionInfo = sourceNode.dataType === _.DATA_TYPES.REFERENCE ? sourceTypeInfo.referenceBlock.connections[sourceHandle] : sourceNode.dataType === _.DATA_TYPES.CALL ? sourceTypeInfo.callBlock.connections[sourceHandle] : sourceTypeInfo.instanceBlock.connections[sourceHandle];
      var targetNode = get().programData[target];
      var targetTypeInfo = get().programSpec.objectTypes[targetNode.type];
      var targetConnectionInfo = targetNode.dataType === _.DATA_TYPES.REFERENCE ? targetTypeInfo.referenceBlock.connections[targetHandle] : targetNode.dataType === _.DATA_TYPES.CALL ? targetTypeInfo.callBlock.connections[targetHandle] : targetTypeInfo.instanceBlock.connections[targetHandle];

      if (sourceConnectionInfo.direction === targetConnectionInfo.direction) {
        return false;
      }

      if (!sourceConnectionInfo.allowed.includes(targetNode.type)) {
        return false;
      } else if (!targetConnectionInfo.allowed.includes(sourceNode.type)) {
        return false;
      } else if (edges.some(function (edge) {
        var foundMatch = edge.parent.id === source && edge.child.id === target && edge.parent.handle === sourceHandle && edge.child.handle === targetHandle; // console.log('match search',{foundMatch,edge,source,target,sourceHandle,targetHandle})

        return foundMatch;
      })) {
        // console.log('already existing')
        return false;
      }

      return true;
    },
    toggleEdgeMode: function toggleEdgeMode(id) {
      set(function (state) {
        var edgeMode = state.programData[id].mode;

        if (edgeMode === _.SIMPLE_PROPERTY_TYPES.STRING) {
          state.programData[id].mode = _.SIMPLE_PROPERTY_TYPES.NUMBER;
          state.programData[id].name = 0;
        } else {
          var edgeCount = Object.values(state.programData).filter(function (d) {
            return d.dataType === _.DATA_TYPES.CONNECTION;
          }).length;
          state.programData[id].mode = _.SIMPLE_PROPERTY_TYPES.STRING;
          state.programData[id].name = "Connection ".concat(edgeCount + 1);
        }
      });
    },
    // Just to illustrate alternative functionExtraTypes
    updateItemBlockColors: function updateItemBlockColors(data) {
      set(function (state) {
        var color = randomColor();
        ["instanceBlock", "referenceBlock", "callBlock"].forEach(function (blockType) {
          if (state.programSpec.objectTypes[data.type][blockType]) {
            state.programSpec.objectTypes[data.type][blockType].color = color;
          }
        });
      });
    },
    clock: new _Timer.Timer(),
    pause: function pause() {
      get().clock.setTimescale(0);
    },
    play: function play(speed) {
      get().clock.setTimescale(speed ? speed : 1);
    },
    reset: function reset(time) {
      get().clock._elapsed = time ? time * 1000 : 0;
    }
  };
};

exports.ProgrammingSlice = ProgrammingSlice;
var ImmerProgrammingSlice = immer(ProgrammingSlice);
exports.ImmerProgrammingSlice = ImmerProgrammingSlice;
var useDefaultProgrammingStore = (0, _zustand.default)(ImmerProgrammingSlice);
exports.useDefaultProgrammingStore = useDefaultProgrammingStore;