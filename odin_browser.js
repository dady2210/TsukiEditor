
class OdinNode {
    constructor(marker, name, typeId, typeName, nodeId) {
        this.marker = marker; // 0x01, 0x02, etc.
        this.name = name; // string (or null if unnamed)
        this.typeId = typeId; // int32
        this.typeName = typeName; // string (if 0x2F), null if (0x30)
        this.nodeId = nodeId; // int32 (can be null for structs)
        this.children = []; // Array of OdinBase (fields)
    }
}

class OdinList {
    constructor(marker, name, length) {
        this.marker = marker; // usually 0x01 (the field name wrapper) or just StartOfArray
        this.name = name;
        this.length = length; // Int64, number of elements
        this.elements = [];
    }
}

class OdinPrimitiveArray {
    constructor(marker, name, numElements, bytesPerElement, rawData) {
        this.marker = marker; // 0x08
        this.name = name;
        this.numElements = numElements;
        this.bytesPerElement = bytesPerElement;
        this.rawData = rawData; // Uint8Array
    }
}

class OdinPrimitive {
    constructor(marker, name, value) {
        this.marker = marker;
        this.name = name;
        this.value = value;
    }
}

class OdinString {
    constructor(marker, name, value) {
        this.marker = marker; // 0x27
        this.name = name;
        this.value = value;
    }
}

class OdinNull {
    constructor(marker, name) {
        this.marker = marker; // 0x2D or 0x2E
        this.name = name;
    }
}

class OdinInternalReference {
    constructor(marker, name, targetNodeId) {
        this.marker = marker; // 0x09 or 0x0A
        this.name = name;
        this.targetNodeId = targetNodeId;
    }
}

class OdinDictionaryEntry {
    constructor(key, value) {
        this.key = key; // OdinBase
        this.value = value; // OdinBase
    }
}





class OdinReader {
    constructor(buffer) {
        this.buffer = new Uint8Array(buffer);
        this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.length);
        this.offset = 0;
        this.decoder = new TextDecoder('utf-16le');
        this.types = {}; 
    }

    readInt32() { const val = this.view.getInt32(this.offset, true); this.offset += 4; return val; }
    readUInt32() { const val = this.view.getUint32(this.offset, true); this.offset += 4; return val; }
    readInt64() {
        const low = this.view.getUint32(this.offset, true);
        const high = this.view.getInt32(this.offset + 4, true);
        this.offset += 8;
        return (BigInt(high) << 32n) | BigInt(low);
    }
    readUInt64() {
        const low = this.view.getUint32(this.offset, true);
        const high = this.view.getUint32(this.offset + 4, true);
        this.offset += 8;
        return (BigInt(high) << 32n) | BigInt(low);
    }
    readFloat32() { const val = this.view.getFloat32(this.offset, true); this.offset += 4; return val; }
    readFloat64() { const val = this.view.getFloat64(this.offset, true); this.offset += 8; return val; }
    readByte() { return this.buffer[this.offset++]; }
    
    readStringBytes() {
        const token = this.readByte();
        if (token !== 0x01) throw new Error('Expected string token 0x01 at ' + (this.offset-1) + ', got ' + token.toString(16));
        const len = this.readInt32();
        const byteLen = len * 2; const strBytes = this.buffer.slice(this.offset, this.offset + byteLen);
        this.offset += byteLen;
        return this.decoder.decode(strBytes);
    }
    
    parse() {
        const ast = [];
        while (this.offset < this.buffer.length) {
            const marker = this.buffer[this.offset];
            if (marker === 0x31) { // EndOfStream
                this.offset++;
                break;
            }
            const node = this.readNext(null);
            if (node) ast.push(node);
        }
        return ast;
    }
    
    readNext(expectedName = null) {
        if (this.offset >= this.buffer.length) return null;
        
        let marker = this.readByte();
        // Dictionary element framing (0x04 0x2E)
        if (marker === 0x04) {
            if (this.buffer[this.offset] === 0x2E) {
                this.offset++; // consume 0x2E
                const keyNode = this.readNext();
                const valNode = this.readNext();
                if (this.buffer[this.offset] === 0x05) {
                    this.offset++; // consume EndOfNode for Dictionary Entry
                } else {
                    console.log('WARNING: Expected 0x05 after dict entry at', this.offset);
                }
                return new OdinDictionaryEntry(keyNode, valNode);
            }
        }

        let name = expectedName;

        switch (marker) {
            case 0x01: // NamedStartOfReferenceNode
            case 0x02: // UnnamedStartOfReferenceNode
            case 0x03: // NamedStartOfStructNode
            case 0x04: // UnnamedStartOfStructNode
                if (marker === 0x01 || marker === 0x03) {
                    name = this.readStringBytes();
                }
                
                let typeId = -1, typeName = null;
                const typeToken = this.readByte();
                if (typeToken === 0x2F) { // TypeName
                    typeId = this.readInt32();
                    typeName = this.readStringBytes();
                    this.types[typeId] = typeName;
                } else if (typeToken === 0x30) { // TypeID
                    typeId = this.readInt32();
                    typeName = this.types[typeId];
                } else {
                    throw new Error('Expected type token 0x2F or 0x30, got ' + typeToken.toString(16) + ' at ' + (this.offset-1) + ' (name was: '+name+')');
                }
                
                let nodeId = null;
                if (marker === 0x01 || marker === 0x02) {
                    nodeId = this.readInt32();
                }
                
                const node = new OdinNode(marker, name, typeId, typeName, nodeId);
                
                // Read children until EndOfNode (0x05)
                while (this.offset < this.buffer.length) {
                    const peek = this.buffer[this.offset];
                    if (peek === 0x05) {
                        this.offset++; // consume EndOfNode
                        break;
                    }
                    node.children.push(this.readNext(null));
                }
                return node;
                
                        case 0x06: // StartOfArray
                const len = this.readInt64();
                const list = new OdinList(marker, name, len);
                while (this.offset < this.buffer.length) {
                    const peek = this.buffer[this.offset];
                    if (peek === 0x07) {
                        this.offset++; // consume EndOfArray
                        break;
                    }
list.elements.push(this.readNext(null));
                }
                return list;
                
                        case 0x17: // NamedInt
                name = this.readStringBytes();
                return new OdinPrimitive(marker, name, this.readInt32());
            case 0x18: // UnnamedInt
                return new OdinPrimitive(marker, name, this.readInt32());
            case 0x1B: // NamedLong
                name = this.readStringBytes();
                return new OdinPrimitive(marker, name, this.readInt64());
            case 0x1C: // UnnamedLong
                return new OdinPrimitive(marker, name, this.readInt64());
            case 0x1D: // NamedULong
                name = this.readStringBytes();
                return new OdinPrimitive(marker, name, this.readUInt64());
            case 0x1E: // UnnamedULong
                return new OdinPrimitive(marker, name, this.readUInt64());
            case 0x1F: // NamedFloat
                name = this.readStringBytes();
                return new OdinPrimitive(marker, name, this.readFloat32());
            case 0x20: // UnnamedFloat
                return new OdinPrimitive(marker, name, this.readFloat32());
            case 0x21: // NamedDouble
                name = this.readStringBytes();
                return new OdinPrimitive(marker, name, this.readFloat64());
            case 0x22: // UnnamedDouble
                return new OdinPrimitive(marker, name, this.readFloat64());
            case 0x27: // NamedString
                name = this.readStringBytes();
                const flag = this.readByte(); // usually 1
                const strLen = this.readInt32();
                const byteLen = strLen * 2; const strBytes = this.buffer.slice(this.offset, this.offset + byteLen);
                this.offset += byteLen;
                const val = this.decoder.decode(strBytes);
                return new OdinString(marker, name, val);
            case 0x28: // UnnamedString
                const uflag = this.readByte();
                const ustrLen = this.readInt32();
                const ubyteLen = ustrLen * 2; const ustrBytes = this.buffer.slice(this.offset, this.offset + ubyteLen);
                this.offset += ubyteLen;
                const uval = this.decoder.decode(ustrBytes);
                return new OdinString(marker, name, uval);
            case 0x2B: // NamedBoolean
                name = this.readStringBytes();
                return new OdinPrimitive(marker, name, this.readByte() !== 0);
            case 0x2C: // UnnamedBoolean
                return new OdinPrimitive(marker, name, this.readByte() !== 0);
            case 0x2D: // NamedNull
                name = this.readStringBytes();
                return new OdinNull(marker, name);
            case 0x2E: // UnnamedNull
                return new OdinNull(marker, name);
            case 0x08: // PrimitiveArray
                const numElems = this.readInt32();
                const bpe = this.readInt32();
                const raw = this.buffer.slice(this.offset, this.offset + numElems * bpe);
                this.offset += numElems * bpe;
                return new OdinPrimitiveArray(marker, name, numElems, bpe, raw);
            case 0x09: // NamedInternalReference
                name = this.readStringBytes();
                return new OdinInternalReference(marker, name, this.readInt32());
            case 0x0A: // UnnamedInternalReference
                return new OdinInternalReference(marker, name, this.readInt32());
            default:
                throw new Error("Unknown marker " + marker.toString(16) + " at " + (this.offset-1) + " (name=" + name + ")");
        }
    }
}





class OdinWriter {
    constructor() {
        this.buffer = new Uint8Array(10 * 1024 * 1024); // 10MB max buffer initially
        this.view = new DataView(this.buffer.buffer);
        this.offset = 0;
        this.writtenTypes = new Set();
    }
    
    ensureCapacity(bytesNeeded) {
        if (this.offset + bytesNeeded > this.buffer.length) {
            const newBuffer = new Uint8Array(this.buffer.length * 2);
            newBuffer.set(this.buffer);
            this.buffer = newBuffer;
            this.view = new DataView(this.buffer.buffer);
        }
    }

    writeInt32(val) {
        this.ensureCapacity(4);
        this.view.setInt32(this.offset, val, true);
        this.offset += 4;
    }
    
    writeUInt32(val) {
        this.ensureCapacity(4);
        this.view.setUint32(this.offset, val, true);
        this.offset += 4;
    }

    writeInt64(val) {
        this.ensureCapacity(8);
        const low = Number(BigInt(val) & 0xFFFFFFFFn);
        const high = Number(BigInt(val) >> 32n);
        this.view.setUint32(this.offset, low, true);
        this.view.setInt32(this.offset + 4, high, true);
        this.offset += 8;
    }
    
    writeUInt64(val) {
        this.ensureCapacity(8);
        const low = Number(BigInt(val) & 0xFFFFFFFFn);
        const high = Number(BigInt(val) >> 32n);
        this.view.setUint32(this.offset, low, true);
        this.view.setUint32(this.offset + 4, high, true);
        this.offset += 8;
    }

    writeFloat32(val) {
        this.ensureCapacity(4);
        this.view.setFloat32(this.offset, val, true);
        this.offset += 4;
    }

    writeFloat64(val) {
        this.ensureCapacity(8);
        this.view.setFloat64(this.offset, val, true);
        this.offset += 8;
    }

    writeByte(val) {
        this.ensureCapacity(1);
        this.buffer[this.offset++] = val;
    }
    
    writeStringBytes(str) {
        this.writeByte(0x01);
        const strLen = str.length;
        this.writeInt32(strLen);
        this.ensureCapacity(strLen * 2);
        for (let i = 0; i < strLen; i++) {
            this.view.setUint16(this.offset, str.charCodeAt(i), true);
            this.offset += 2;
        }
    }
    
    writeName(name) {
        if (name !== null) {
            this.writeStringBytes(name);
        }
    }
    
    write(ast) {
        for (const node of ast) {
            this.writeNode(node);
        }
        // no EndOfStream byte needed in this format
        return this.buffer.slice(0, this.offset);
    }
    
    writeNode(node) {
        if (!node) return;
        
        if (node instanceof OdinDictionaryEntry) {
            this.writeByte(0x04);
            this.writeByte(0x2E);
            this.writeNode(node.key);
            this.writeNode(node.value);
            this.writeByte(0x05); // EndOfNode for Dictionary Entry
            return;
        }

        if (node.marker === undefined) { console.error("INVALID NODE IN AST:", node); throw new Error(`Writer: Node is missing marker. Constructor: ${node.constructor ? node.constructor.name : "none"}, keys: ${Object.keys(node).join(", ")}, name: ${node.name || "none"}`); } this.writeByte(node.marker);
        
        switch (node.marker) {
            case 0x01: // NamedStartOfReferenceNode
            case 0x02: // UnnamedStartOfReferenceNode
            case 0x03: // NamedStartOfStructNode
            case 0x04: // UnnamedStartOfStructNode
                if (node.marker === 0x01 || node.marker === 0x03) {
                    this.writeName(node.name);
                }
                
                // Important: Interning strings logic for types
                if (!this.writtenTypes.has(node.typeId)) {
                    this.writeByte(0x2F); // TypeName
                    this.writeInt32(node.typeId);
                    this.writeStringBytes(node.typeName);
                    this.writtenTypes.add(node.typeId);
                } else {
                    this.writeByte(0x30); // TypeID
                    this.writeInt32(node.typeId);
                }
                
                if (node.marker === 0x01 || node.marker === 0x02) {
                    this.writeInt32(node.nodeId);
                }
                
                for (const child of node.children) {
                    this.writeNode(child);
                }
                this.writeByte(0x05); // EndOfNode
                break;
                
            case 0x06: // StartOfArray
                this.writeName(node.name);
                // The len needs to be accurate to the amount of elements, not necessarily what it was parsed as!
                // Wait, OdinList doesn't store length except as a property. Let's just use elements.length for safety if it was mutated.
                // But what if it's multidimensional or something? Best to use elements.length!
                this.writeInt64(node.elements.length);
                for (const elem of node.elements) {
                    this.writeNode(elem);
                }
this.writeByte(0x07); // EndOfArray
                break;
                
            case 0x17:
                this.writeName(node.name);
                this.writeInt32(node.value);
                break;
            case 0x18:
                this.writeInt32(node.value);
                break;
            case 0x1B:
                this.writeName(node.name);
                this.writeInt64(node.value);
                break;
            case 0x1C:
                this.writeInt64(node.value);
                break;
            case 0x1D:
                this.writeName(node.name);
                this.writeUInt64(node.value);
                break;
            case 0x1E:
                this.writeUInt64(node.value);
                break;
            case 0x1F:
                this.writeName(node.name);
                this.writeFloat32(node.value);
                break;
            case 0x20:
                this.writeFloat32(node.value);
                break;
            case 0x21:
                this.writeName(node.name);
                this.writeFloat64(node.value);
                break;
            case 0x22:
                this.writeFloat64(node.value);
                break;
            case 0x27: // NamedString
                this.writeName(node.name);
                this.writeByte(0x01); // flag
                this.writeInt32(node.value.length);
                this.ensureCapacity(node.value.length * 2);
                for (let i = 0; i < node.value.length; i++) {
                    this.view.setUint16(this.offset, node.value.charCodeAt(i), true);
                    this.offset += 2;
                }
                break;
            case 0x28: // UnnamedString
                this.writeByte(0x01); // flag
                this.writeInt32(node.value.length);
                this.ensureCapacity(node.value.length * 2);
                for (let i = 0; i < node.value.length; i++) {
                    this.view.setUint16(this.offset, node.value.charCodeAt(i), true);
                    this.offset += 2;
                }
                break;
            case 0x2B: // NamedBoolean
                this.writeName(node.name);
                this.writeByte(node.value ? 1 : 0);
                break;
            case 0x2C: // UnnamedBoolean
                this.writeByte(node.value ? 1 : 0);
                break;
            case 0x2D: // NamedNull
            case 0x2E: // UnnamedNull
                this.writeName(node.name);
                break;
            case 0x08: // PrimitiveArray
                this.writeName(node.name);
                this.writeInt32(node.numElements);
                this.writeInt32(node.bytesPerElement);
                this.ensureCapacity(node.rawData.length);
                this.buffer.set(node.rawData, this.offset);
                this.offset += node.rawData.length;
                break;
            case 0x09: // NamedInternalReference
                this.writeName(node.name);
                this.writeInt32(node.targetNodeId);
                break;
            case 0x0A: // UnnamedInternalReference
                this.writeInt32(node.targetNodeId);
                break;
            default:
                throw new Error("Writer: Unknown marker " + node.marker.toString(16));
        }
    }
}


