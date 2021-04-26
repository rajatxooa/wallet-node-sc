/**
 *  Xooa Wallet JavaScript smart contract
 *
 *  Copyright 2021 Xooa
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License. You may obtain a copy of the License at:
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
 *  for the specific language governing permissions and limitations under the License.
 */
 

const shim = require('fabric-shim');
const util = require('util');

var Chaincode = class {

  // Initialize the chaincode
  async Init(stub) {
    console.info('========= Init =========');
    
    return shim.success();
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let method = this[ret.fcn];
    if (!method) {
      console.log('no method of name:' + ret.fcn + ' found');
      return shim.error('no method of name:' + ret.fcn + ' found');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async load(stub, args) {
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let A = args[0];  // pub key
    let B = args[1];  // amount

    // TODO add check. only admin pkey can invoke this fcn

    // Get the existing wallet amount
    let existingBalanceBytes = await stub.getState(A);
    if (!existingBalanceBytes) {
      // if doesnot exists then create new
      existingBalanceBytes = 0;
    }
    let walletBalance = parseInt(existingBalanceBytes.toString());

    // Perform the loading of amount
    let amount = parseInt(B);
    if (typeof amount !== 'number') {
      throw new Error('Expecting integer value for amount to be transaferred');
    }

    walletBalance = walletBalance + amount;
    console.info(util.format('walletBalance = %d', walletBalance));

    // Write the states back to the ledger
    await stub.putState(A, Buffer.from(walletBalance.toString()));
  }

  async transfer(stub, args) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }

    let FromPublicKey = args[0];
    let ToPublicKey = args[1];
    if (!FromPublicKey || !ToPublicKey) {
      throw new Error('asset holding must not be empty');
    }

    // TODO add check. only admin pkey can invoke this fcn


    let amount = parseInt(args[2]);
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Expecting integer value for amount to be transferred');
    }

    // Get the balance from the ledger
    let Avalbytes = await stub.getState(FromPublicKey);
    if (!Avalbytes) {
      throw new Error('Load balance');
    }
    let Aval = parseInt(Avalbytes.toString());

    if (Aval < amount) {
      throw new Error('Load balance');
    }
    
    let Bvalbytes = await stub.getState(ToPublicKey);

    let Bval = Bvalbytes ? parseInt(Bvalbytes.toString()) : 0;
    // Perform the execution


    Aval = Aval - amount;
    Bval = Bval + amount;
    console.info(util.format('Aval = %d, Bval = %d\n', Aval, Bval));

    // Write the states back to the ledger
    await stub.putState(FromPublicKey, Buffer.from(Aval.toString()));
    await stub.putState(ToPublicKey, Buffer.from(Bval.toString()));

  }

  async payout(stub, args) {

  }

  async querywalletAmount(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1')
    }

    let jsonResp = {};
    let A = args[0];

    // Get the state from the ledger
    let Avalbytes = await stub.getState(A);

    jsonResp.PublicKey = A;
    jsonResp.Amount = Avalbytes ? Avalbytes.toString() : '0'; // default amount is 0
    console.info('Query Response:');
    console.info(jsonResp);
    return Avalbytes;
  }

  // Deletes an entity from state
  async delete(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let A = args[0];

    // Delete the key from the state in ledger
    await stub.deleteState(A);
  }
};

shim.start(new Chaincode());
