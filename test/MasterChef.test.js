const { expect, assert } = require("chai");

const { ethers } = require("hardhat")

async function advanceBlock() {
  return ethers.provider.send("evm_mine", [])
}

async function advanceBlockTo(blockNumber) {
  for (let i = await ethers.provider.getBlockNumber(); i < blockNumber; i++) {
    await advanceBlock()
  }
}

describe("MasterChef", function () {

  before(async function () {
    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
    this.dev = this.signers[3]
    this.minter = this.signers[4]

    this.HeshiToken = await ethers.getContractFactory("HeshiToken")
    this.MasterChef = await ethers.getContractFactory("MasterChef")
    this.MockBEP20 = await ethers.getContractFactory("MockBEP20", this.minter)

    this.heshi = await this.HeshiToken.deploy()
    await this.heshi.deployed()
    // 每个区块 （3秒) 10个 
    this.chef = await this.MasterChef.deploy(this.heshi.address, this.dev.address, '100', '0');
    await this.chef.deployed()

    this.lp1 = await this.MockBEP20.deploy('LPToken', 'LP1', '1000000');
    this.lp2 = await this.MockBEP20.deploy('LPToken', 'LP2', '1000000');
    this.lp3 = await this.MockBEP20.deploy('LPToken', 'LP3', '1000000');
    this.lp4 = await this.MockBEP20.deploy('LPToken', 'LP4', '1000000');
    this.lp5 = await this.MockBEP20.deploy('LPToken', 'LP5', '1000000');
    this.lp6 = await this.MockBEP20.deploy('LPToken', 'LP6', '1000000');
    this.lp7 = await this.MockBEP20.deploy('LPToken', 'LP7', '1000000');
    this.lp8 = await this.MockBEP20.deploy('LPToken', 'LP8', '1000000');
    this.lp9 = await this.MockBEP20.deploy('LPToken', 'LP9', '1000000');
    this.lp10 = await this.MockBEP20.deploy('LPToken', 'LP10', '1000000');

    await this.lp1.transfer(this.bob.address, '2000');
    await this.lp2.transfer(this.bob.address, '2000');
    await this.lp3.transfer(this.bob.address, '2000');

    await this.lp1.transfer(this.dev.address, '2000');
    await this.lp2.transfer(this.dev.address, '2000');
    await this.lp3.transfer(this.dev.address, '2000');

    await this.lp1.transfer(this.alice.address, '2000');
    await this.lp2.transfer(this.alice.address, '2000');
    await this.lp3.transfer(this.alice.address, '2000');
  })

  beforeEach(async function () {

  })

  it("should set correct state variables", async function () {
    await this.heshi.transferOwnership(this.chef.address);

    const heshi = await this.chef.heshi()
    const devaddr = await this.chef.devaddr()
    const owner = await this.heshi.owner()

    expect(heshi).to.equal(this.heshi.address)
    expect(devaddr).to.equal(this.dev.address)
    expect(owner).to.equal(this.chef.address)
  })

  it('deposit/withdraw', async function () {
    await this.chef.add('5000', this.heshi.address, true);

    await this.chef.add('1000', this.lp1.address, true);
    await this.chef.add('1000', this.lp2.address, true);
    await this.chef.add('1000', this.lp3.address, true);
    await this.chef.add('1000', this.lp4.address, true);
    await this.chef.add('1000', this.lp5.address, true);
    await this.chef.add('1000', this.lp6.address, true);
    await this.chef.add('1000', this.lp7.address, true);
    await this.chef.add('1000', this.lp8.address, true);
    await this.chef.add('1000', this.lp9.address, true);
    await this.chef.add('1000', this.lp10.address, true);

    console.log("pool 0", (await this.chef.poolInfo(0)).toString())

    assert.equal((await this.chef.poolLength()).toString(), "11");
    assert.equal((await this.chef.totalAllocPoint()).toString(), "15000");

    await this.chef.set(0, 10000, true);
    console.log("pool 0", (await this.chef.poolInfo(0)).toString())
    assert.equal((await this.chef.totalAllocPoint()).toString(), "20000");

    await this.lp1.connect(this.alice).approve(this.chef.address, '1000', { from: this.alice.address });
    await this.lp1.connect(this.bob).approve(this.chef.address, '1000', { from: this.bob.address });

    await this.chef.connect(this.alice).deposit(1, '20', { from: this.alice.address });

    let cur_block = await ethers.provider.getBlockNumber();
    console.log("current block, ", cur_block);
    await advanceBlockTo( ( cur_block + 10) );
    cur_block = await ethers.provider.getBlockNumber();
    console.log("current block, ", cur_block);

    await this.chef.connect(this.bob).deposit(1, '20', { from: this.bob.address });

    console.log("pool 1", (await this.chef.poolInfo(0)).toString())

    console.log("user info 1", (await this.chef.userInfo(0, this.alice.address)).toString())

    await this.chef.connect(this.alice).withdraw(1, '20', { from: this.alice.address });
    assert.equal((await this.lp1.balanceOf(this.chef.address)).toString(), '20');
    assert.equal((await this.lp1.balanceOf(this.alice.address)).toString(), '2000');

    console.log("total heshi supply ", (await this.heshi.totalSupply()).toString());

    console.log("alice heshi balance ", (await this.heshi.balanceOf(this.alice.address)).toString());
    console.log("bob heshi balance ", (await this.heshi.balanceOf(this.bob.address)).toString());
    console.log("dev heshi balance ", (await this.heshi.balanceOf(this.dev.address)).toString());
    console.log("chef heshi balance ", (await this.heshi.balanceOf(this.chef.address)).toString());

    console.log("bob pending heshi ", (await this.chef.pendingHeshi(0, this.bob.address)).toString())
    console.log("alice pending heshi ", (await this.chef.pendingHeshi(0, this.alice.address)).toString())

    await this.chef.connect(this.bob).withdraw(0, '0', { from: this.bob.address });
    await this.chef.connect(this.alice).withdraw(0, '0', { from: this.alice.address });

    console.log("total heshi supply ", (await this.heshi.totalSupply()).toString());
    console.log("alice heshi balance ", (await this.heshi.balanceOf(this.alice.address)).toString());
    console.log("bob heshi balance ", (await this.heshi.balanceOf(this.bob.address)).toString());
    console.log("dev heshi balance ", (await this.heshi.balanceOf(this.dev.address)).toString());
    console.log("chef heshi balance ", (await this.heshi.balanceOf(this.chef.address)).toString());
    
    console.log("user info 1", (await this.chef.userInfo(0, this.alice.address)).toString())

    await this.lp2.connect(this.alice).approve(this.chef.address, '100', { from: this.alice.address });
    await this.chef.connect(this.alice).deposit(2, '20', { from: this.alice.address });
    await this.chef.connect(this.alice).deposit(2, '0', { from: this.alice.address });
    await this.chef.connect(this.alice).deposit(2, '40', { from: this.alice.address });
    await this.chef.connect(this.alice).deposit(2, '0', { from: this.alice.address });
    assert.equal((await this.lp2.balanceOf(this.chef.address)).toString(), '60');

    await this.lp1.connect(this.dev).approve(this.chef.address, '100', { from: this.dev.address });
    assert.equal((await this.lp1.balanceOf(this.dev.address)).toString(), '2000');
    await this.chef.connect(this.dev).deposit(1, '50', { from: this.dev.address });
    assert.equal((await this.lp1.balanceOf(this.dev.address)).toString(), '1950');
  })

  it('should allow dev and only dev to update dev', async function () {
    assert.equal((await this.chef.devaddr()).valueOf(), this.dev.address);
    await this.chef.connect(this.dev).dev(this.bob.address, { from: this.dev.address });
    assert.equal((await this.chef.devaddr()).valueOf(), this.bob.address);
    await this.chef.connect(this.bob).dev(this.alice.address, { from: this.bob.address });
    assert.equal((await this.chef.devaddr()).valueOf(), this.alice.address);
  })
});