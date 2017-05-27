import {
	chai,
	sinon,
	describe,
	it,
	beforeEach,
	afterEach,
	expect,
} from './test.helper';

import {Subject} from 'rxjs';

import Machine from '../src/util/Machine';

/** @test */
describe("Machine state machine", () => {
	
	let machine1, subject1_1, subject1_2, values1;
	beforeEach(() => {
		machine1   = new Machine('Machine 1', { state: 'STATE_1' });
		subject1_1 = new Subject();
		subject1_2 = new Subject();
		values1    = [];
		machine1.extend(({ enterState, subscribeDuringState }) => ({
			STATE_1: (v) => {
				values1.push(v);
				subject1_1::enterState('STATE_2');
			},
			STATE_2: (v) => {
				values1.push(v);
				subject1_2::enterState('STATE_1');
			}
		}));
	});
	
	/** @test */
	it("can move from state to state", () => {
		expect(machine1.state).to.equal('STATE_1');
		expect(values1).to.deep.equal([ undefined ]);
		
		subject1_1.next('value 1');
		
		expect(machine1.state).to.equal('STATE_2');
		expect(values1).to.deep.equal([ undefined, 'value 1' ]);
		
		subject1_1.next('value 2');
		
		expect(machine1.state).to.equal('STATE_2');
		expect(values1).to.deep.equal([ undefined, 'value 1' ]);
		
		subject1_2.next('value 3');
		
		expect(machine1.state).to.equal('STATE_1');
		expect(values1).to.deep.equal([ undefined, 'value 1', 'value 3' ]);
		
	});
	
	
	let machine2, subject2_3, subject2_4, subject2_5, values2;
	beforeEach(() => {
		machine2   = new Machine('Machine 2', { state: 'STATE_3' });
		subject2_3 = new Subject();
		subject2_4 = new Subject();
		subject2_5 = new Subject();
		values2 = [];
		machine2.extend(({ enterState, subscribeDuringState }) => ({
			STATE_3: (v) => {
				values2.push(v);
				subject2_3::enterState('STATE_4');
			},
			STATE_4: (v) => {
				values2.push(v);
				subject2_4::enterState('STATE_3');
			},
			STATE_5: (v) => {
				values2.push(v);
				subject2_5::enterState('STATE_3');
			}
		}));
	});
	
	
	/** @test */
	it("can link states from multiple state machines", () => {
		
		machine2.link(
			['STATE_4', machine1.STATE_2, 'STATE_5']
		);
		
		expect(machine1.state).to.equal('STATE_1');
		expect(values1).to.deep.equal([ undefined ]);
		expect(machine2.state).to.equal('STATE_3');
		expect(values2).to.deep.equal([ undefined ]);
		
		subject1_1.next('value 1');
		
		expect(machine1.state).to.equal('STATE_2');
		expect(values1).to.deep.equal([ undefined, 'value 1' ]);
		expect(machine2.state).to.equal('STATE_3');
		expect(values2).to.deep.equal([ undefined ]);
		
		subject1_2.next('value 2');
		
		expect(machine1.state).to.equal('STATE_1');
		expect(values1).to.deep.equal([ undefined, 'value 1', 'value 2' ]);
		expect(machine2.state).to.equal('STATE_3');
		expect(values2).to.deep.equal([ undefined ]);
		
		subject2_3.next('value 3');
		
		expect(machine1.state).to.equal('STATE_1');
		expect(values1).to.deep.equal([ undefined, 'value 1', 'value 2' ]);
		expect(machine2.state).to.equal('STATE_4');
		expect(values2).to.deep.equal([ undefined, 'value 3' ]);
		
		subject1_1.next('value 4');
		
		expect(machine1.state).to.equal('STATE_2');
		expect(values1).to.deep.equal([ undefined, 'value 1', 'value 2', 'value 4' ]);
		expect(machine2.state).to.equal('STATE_5');
		expect(values2).to.deep.equal([ undefined, 'value 3', 'value 4' ]);
		
		subject2_5.next('value 5');
		
		expect(machine1.state).to.equal('STATE_2');
		expect(values1).to.deep.equal([ undefined, 'value 1', 'value 2', 'value 4' ]);
		expect(machine2.state).to.equal('STATE_3');
		expect(values2).to.deep.equal([ undefined, 'value 3', 'value 4', 'value 5' ]);
		
	});
	
});
