import { Money, UnsafeIntegerError, IncompatibleCurrencyError } from '../src';
import { expect } from 'chai';

describe('Money class', () => {

  it('should instantiate', () => {

    const m = new Money(1, 'USD');
    expect(m).to.be.an.instanceof(Money);
    expect(m.currency).to.equal('USD');

  });

  it('should error when instantiating with inprecise numbers', () => {

    expect( () => {
      new Money(1.1, 'yen');
    }).to.throw(UnsafeIntegerError);

  });


  describe('toFixed', () => {

    const tests = [
      [1, 3, '1.000'],

      ['3.5', 0, '4'],
      ['-3.5', 0, '-4'],
      ['2.5', 0, '2'],
      ['-2.5', 0, '-2'],

      ['.35',  1, '0.4'],
      ['-.35', 1, '-0.4'],
      ['.25',  1, '0.2'],
      ['-.25', 1, '-0.2'],


      [1,       15, '1.' + ('0'.repeat(15))],
      ['1.555', 15, '1.555' + ('0'.repeat(12))],
      ['1.00555', 15, '1.00555' + ('0'.repeat(10))],

    ];

    for(const test of tests) {
      it(`should return ${test[2]} when calling toFixed on ${test[0]} with ${test[1]} precision`, () => {

        const m = new Money(test[0], 'USD');
        expect(m.toFixed(<number>test[1])).to.equal(test[2]);

      });
    }

  });

  describe('Numbers with more precision than 12 digits', () => {

    it('should round to even beyond the 12-digit precision', () => {

      const m = new Money('1.1112223330005', 'USD');
      expect(m).to.be.an.instanceof(Money);
      expect(m.currency).to.equal('USD');
      expect(m.toFixed(13)).to.equal('1.1112223330000');

    });

    it('should round to even beyond the 12-digit precision (2)', () => {

      const m = new Money('1.1112223330015', 'USD');
      expect(m).to.be.an.instanceof(Money);
      expect(m.currency).to.equal('USD');
      expect(m.toFixed(13)).to.equal('1.1112223330020');

    });

  });

  describe('add', () => {

    it('should return a new Money object with the added number', () => {

      const x = new Money(1, 'USD');
      const y = new Money(2, 'USD');
      const z = y.add(x);

      expect(z.toFixed(3)).to.equal('3.000');

    });

    it('should work with non-money objects', () => {

      const x = 1;
      const y = new Money(2, 'USD');
      const z = y.add(x);

      expect(z.toFixed(3)).to.equal('3.000');

    });

    it('should error when using different currencies', () => {

      const x = new Money(1, 'USD');
      const y = new Money(2, 'YEN');

      expect( () => y.add(x)).to.throw(IncompatibleCurrencyError);

    });

    const cases = [
      ['0.1', '0.2', '0.30'],
      ['0.3', '-0.2', '0.10'],
      [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, '18014398509481982.00'],

      ['17.954', '.001', '17.96'],

      ['0.002', '0.003', '0.00'],
      ['0.012', '0.003', '0.02'],
    ];

    for(const cas of cases) {

      it(`${cas[0]} + ${cas[1]} = ${cas[2]}`, () => {

        const x = new Money(cas[0], 'USD');
        const y = new Money(cas[1], 'USD');

        expect(x.add(y).toFixed(2)).to.equal(cas[2]);

      });

    }

  });

  describe('subtract', () => {

    it('should return a new Money object with the subtracted number', () => {

      const x = new Money(1, 'USD');
      const y = new Money(2, 'USD');
      const z = x.subtract(y);

      expect(z.toFixed(3)).to.equal('-1.000');

    });

    it('should work with non-money objects', () => {

      const x = 3;
      const y = new Money(2, 'USD');
      const z = y.subtract(x);

      expect(z.toFixed(3)).to.equal('-1.000');

    });

    it('should error when using different currencies', () => {

      const x = new Money(1, 'USD');
      const y = new Money(2, 'YEN');

      expect( () => y.subtract(x)).to.throw(IncompatibleCurrencyError);

    });

    const cases = [
      ['0.1', '0.2', '-0.10'],
      ['0.3', '-0.2', '0.50'],
      // These are larger than MAX_SAFE_INT
      ['9007199254740992.555555555','9007199254740992.555555555', '0.00'],
    ];

    for(const cas of cases) {

      it(`${cas[0]} + ${cas[1]} = ${cas[2]}`, () => {

        const x = new Money(cas[0], 'USD');
        const y = new Money(cas[1], 'USD');

        expect(x.subtract(y).toFixed(2)).to.equal(cas[2]);

      });

    }


  });

  describe('divide', () => {

    const cases = [
      ['1',   '3', '0.33'],
      ['-1' , '3', '-0.33'],
      ['1',  '-3', '-0.33'],
      ['-1', '-3', '0.33'],

      ['0.3',   '3', '0.10'],
      ['-0.3',  '3', '-0.10'],
      ['0.3',  '-3', '-0.10'],
      ['-0.3', '-3', '0.10'],

      // Round half even (down)
      ['3.015',   '3', '1.00'],
      ['-3.015',  '3', '-1.00'],
      ['3.015',  '-3', '-1.00'],
      ['-3.015', '-3', '1.00'],

      // Round half to even (up)
      ['3.045',   '3', '1.02'],
      ['-3.045',  '3', '-1.02'],
      ['3.045',  '-3', '-1.02'],
      ['-3.045', '-3', '1.02'],


    ];

    for (const cas of cases) {

      it(`${cas[0]} / ${cas[1]} = ${cas[2]}`, () => {

        const x = new Money(cas[0], 'ETH');
        expect(x.divide(cas[1]).toFixed(2)).to.equal(cas[2]);

      });

    }

  });

  describe('multiply', () => {

    const cases = [
      ['1', '3', '3.00'],
      ['10000', 20, '200000.00'],
      [20,   5, '100.00'],
      [-20,  5, '-100.00'],
      [-20, -5, '100.00'],
      [20,  -5, '-100.00'],
      ['0.5',   '0.2', '0.10'],
      ['-0.5',  '0.2', '-0.10'],
      ['-0.5', '-0.2', '0.10'],
      ['0.5',  '-0.2', '-0.10'],
    ];

    for (const cas of cases) {

      it(`${cas[0]} / ${cas[1]} = ${cas[2]}`, () => {

        const x = new Money(cas[0], 'ETH');
        expect(x.multiply(cas[1]).toFixed(2)).to.equal(cas[2]);

      });

    }

  });

});
