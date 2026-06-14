// Generate dearson-style "tweet screenshot" cards per product.
// Multiple variations per product (rotated by calendar_id) so posts feel unique
// without needing runtime image rendering.
//
// Run: node marketing/scripts/generate-product-cards.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const IMG_DIR = path.resolve(process.cwd(), 'images');
const CARDS_DIR = path.join(IMG_DIR, 'cards');
const LOGO_PATH = path.join(IMG_DIR, 'logo.png');
if (!fs.existsSync(CARDS_DIR)) fs.mkdirSync(CARDS_DIR, { recursive: true });
const LOGO_B64 = fs.readFileSync(LOGO_PATH).toString('base64');
const LOGO = `data:image/png;base64,${LOGO_B64}`;

// 8 letters per product = 32 unique cards. Worker rotates by calendar_id % 8.
const LETTERS = {
  2: [ // BUDGET / AWARENESS
    { persona: 'broke me at 22', lines: ['Stop guessing where the money went.', 'Open the bank app on Sunday.', 'Write down every dollar for one week.', 'Do not hide. Look.'], closing: 'You cannot fix what you refuse to see. The number is the truth. The avoidance is the wound.' },
    { persona: 'me before I knew where it went', lines: ['Your money is leaving. You just cannot see it.', 'Open the app on a Sunday morning.', 'Write down everything for fourteen days.', 'The number will shock you.', 'But the shock is the cure.'], closing: 'You cannot heal what you refuse to measure. Comfort is why you are still broke.' },
    { persona: 'me with a fresh raise', lines: ['The raise feels infinite for thirty days.', 'It is not. Annual things already have your name.', 'Car insurance. Phone bill. Registration.', 'Divide every yearly cost by twelve.', 'That is your real salary.'], closing: 'A raise without a calendar is a longer rope to hang yourself with later.' },
    { persona: 'me who avoids the bank app', lines: ['You know what the number is.', 'You are hiding from it.', 'The avoidance costs more than the shame.', 'Open it. Look once. Write it down.', 'Tomorrow you will know the truth.'], closing: 'Fear of the number keeps you broke. Anger at the number sets you free.' },
    { persona: 'me on a Sunday night', lines: ['The dread is not about the bills.', 'It is about not knowing.', 'You can fix the not-knowing in one weekend.', 'You cannot fix it by hoping.'], closing: 'The peace you want is on the other side of one honest look.' },
    { persona: 'me who buys to feel better', lines: ['The purchase ends the bad feeling for ten minutes.', 'Then it returns with a charge attached.', 'Name the feeling before you name the cart.', 'The feeling is the bill.'], closing: 'You are not bad with money. You are using money to pay a debt that money cannot settle.' },
    { persona: 'me lying about how much I spend', lines: ['He asks. You shave fifteen percent off.', 'You believe your shaved number by Friday.', 'You wonder by Monday why nothing adds up.', 'Tell the truth on a page. Even if no one sees it.'], closing: 'The lie to your partner is small. The lie to yourself is what keeps you stuck.' },
    { persona: 'me checking the balance through one eye', lines: ['One open. One squinted shut.', 'You already know.', 'Looking confirms it. Hiding extends it.', 'Open both eyes for thirty seconds.', 'You will live.'], closing: 'The only way out of the loop is through it.' },
  ],

  3: [ // PROFIT / BUSINESS
    { persona: 'small business owner', lines: ['Revenue is the noise.', 'Profit is the signal.', 'Pay yourself first.', 'Know your margin before you grow.', 'A busy week is not a wealthy week.'], closing: 'If you cannot say your profit margin without checking, you do not own a business. You own a job that pays in receipts.' },
    { persona: 'business owner who works weekends', lines: ['You are not tired because of sales.', 'You are tired because you do not know if you earned.', 'Revenue hides the truth.', 'Six figures can mean nothing.', 'Sleep returns when the numbers do.'], closing: 'Until you can see what stays, you work for the numbers, not for yourself.' },
    { persona: 'freelancer at year two', lines: ['Year one was the rush.', 'Year two is the bill.', 'Taxes. Tools. Insurance.', 'Save thirty percent from every invoice.', 'Future you needs that money more than current you does.'], closing: 'Most freelancers do not fail at the work. They fail at saving from the work.' },
    { persona: 'me before I knew margin', lines: ['I doubled revenue and felt poorer.', 'Costs grew faster than sales.', 'I had no page that showed it.', 'I just felt it in the silence after deposits.'], closing: 'You can grow yourself broke. The graph that protects you is margin, not revenue.' },
    { persona: 'business owner with no vacation in three years', lines: ['You are the bottleneck.', 'You are also the brand.', 'Write down what only you can do.', 'Train someone for the rest.', 'A business you cannot leave is a job with bad benefits.'], closing: 'Time is the only number that matters. Profit just buys it back.' },
    { persona: 'me afraid to raise my prices', lines: ['Your prices are a story you tell yourself.', 'The story has gotten old.', 'Look at the margin.', 'Look at the hours.', 'Raise once. The world keeps spinning.'], closing: 'Underpricing is not humility. It is fear wearing a kind face.' },
    { persona: 'me who counts revenue not profit', lines: ['Revenue is how loud you are.', 'Profit is how rich you are.', 'They are not the same number.', 'They are rarely on the same page.', 'Until they are, you guess.'], closing: 'Big revenue with small margin is a job you cannot quit.' },
    { persona: 'business owner one tax bill from broke', lines: ['You feel rich on the deposit day.', 'You feel poor on the tax day.', 'The gap is a savings account.', 'Move thirty percent the day it lands.', 'Pretend it was never yours.'], closing: 'Tax season does not hurt people who took it seriously in January.' },
  ],

  4: [ // DEBT
    { persona: 'me with six debts', lines: ['Pick one to attack.', 'Watch only that one.', 'Make minimums on the rest.', 'Celebrate the small line moving.', 'Do not quit at month four.'], closing: 'You feel like nothing is changing because you cannot see it. The shame goes when the picture appears.' },
    { persona: 'me on month four', lines: ['You feel like nothing is moving.', 'You are wrong.', 'You need a page that proves you.', 'Without proof, you quit.', 'With proof, you finish.'], closing: 'The line moves before you feel it move. Find the page that shows it.' },
    { persona: 'me staring at the minimum payment', lines: ['The minimum is the lie.', 'It feels like progress.', 'It is the rope around your neck.', 'One extra dollar above minimum is freedom.'], closing: 'Minimum is what the lender wants. Above-minimum is what you want.' },
    { persona: 'me ready to give up', lines: ['You have done this for ninety days.', 'You feel done.', 'The next thirty days are where it breaks.', 'Hold the line. The line will hold you.'], closing: 'Quitting in month four is the most expensive thing you will ever do.' },
    { persona: 'me hiding the loan app', lines: ['You deleted it.', 'You re-downloaded it.', 'You deleted it again.', 'The number is not the problem.', 'Not seeing it is the problem.'], closing: 'You cannot outrun a balance. You can only outwork it. The first step is keeping the app installed.' },
    { persona: 'me feeling the weight of every bill', lines: ['Each bill carries its own voice.', 'They argue in your head.', 'List them on paper.', 'Voices stop when names appear.', 'Paper is louder than your head.'], closing: 'A list is a door. Your head is a maze. Choose the door.' },
    { persona: 'me considering bankruptcy at 32', lines: ['Talk to a real person before a real decision.', 'Free counselling exists.', 'Bankruptcy is real. It is also permanent.', 'Try one honest month with the numbers first.', 'Then decide.'], closing: 'The worst decisions about debt are made in panic. Make this one in daylight.' },
    { persona: 'me who pays everything and feels nothing', lines: ['You paid on time. All of them.', 'And still you feel underwater.', 'Because you cannot see what moved.', 'Movement without proof feels like nothing.'], closing: 'Discipline without visibility burns people out. See the line move. Stay alive.' },
  ],

  5: [ // CASH FLOW / FUTURE
    { persona: 'me three weeks after payday', lines: ['The rich feeling is a 14-day window.', 'Annual bills already have your name.', 'December was on your calendar in January.', 'Look at the next 12 months on one page.'], closing: 'You do not have a money problem. You have a sight problem. The future is loud. You just cannot hear it yet.' },
    { persona: 'me before December', lines: ['The bills you are ignoring know the date.', 'The gifts you have not bought are on the calendar.', 'Your future self is screaming.', 'You cannot hear her yet.'], closing: 'Look at the months on one page. The panic loses its grip when the months are visible.' },
    { persona: 'me at the surprise tax bill', lines: ['It was not a surprise.', 'You just refused to look at it.', 'A 1099 in January is a number in April.', 'Save the day money lands. Not the day taxes are due.'], closing: 'Surprises in money are almost never surprises. They are confessions you avoided making.' },
    { persona: 'me at the next car repair', lines: ['Cars break. That is not a surprise.', 'You knew this car would cost something.', 'You hoped you would have moved on first.', 'Put fifty dollars away every month for the inevitable.'], closing: 'You cannot prevent the repair. You can prevent the panic.' },
    { persona: 'me three months from broke', lines: ['You see it. You feel it.', 'You hope it will fix itself.', 'It will not.', 'Three months is enough time to change everything.', 'But not if you spend the first month hoping.'], closing: 'Hope is not a plan. Hope is what makes the plan late.' },
    { persona: 'me at the bonus', lines: ['You feel rich for fourteen days.', 'You spent it before it arrived.', 'You will not remember what on.', 'Move half before you see it.', 'Spend the rest like normal money.'], closing: 'Bonuses do not change broke. Discipline does.' },
    { persona: 'me ignoring annual subscriptions', lines: ['They charge once a year.', 'You agreed twelve months ago.', 'You cannot remember signing up.', 'Open the statement. Find every one.', 'Cancel the ones you forgot.'], closing: 'The bills that hurt most are the ones you cannot remember saying yes to.' },
    { persona: 'me with no plan past Friday', lines: ['You know what is in the bank today.', 'You do not know what is in it in 90 days.', 'You are flying blind in slow motion.', 'Put the next 12 months on one page.'], closing: 'A plan does not have to be perfect. It only has to exist.' },
  ],
};

function wrap(text, max) {
  const words = text.split(' ');
  const out = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { out.push(cur.trim()); cur = w; }
    else { cur = (cur + ' ' + w).trim(); }
  }
  if (cur) out.push(cur.trim());
  return out;
}

function svg({ persona, lines, closing }) {
  const PAD_X = 80;
  const TOP = 80;
  const HEADER_H = 110;
  const dearY = TOP + HEADER_H + 60;
  const LINE_H = 60;
  const lineStartY = dearY + 80;
  const afterListY = lineStartY + lines.length * LINE_H + 30;
  const closingLines = closing ? wrap(closing, 38) : [];
  const closingY = afterListY + 50;
  const totalH = closingY + closingLines.length * 50 + 60;
  const H = Math.max(1350, totalH);
  const W = 1080;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#FFFFFF"/>
    <image href="${LOGO}" x="${PAD_X}" y="${TOP}" width="90" height="90"/>
    <text x="${PAD_X + 110}" y="${TOP + 42}" font-family="Helvetica, Arial, sans-serif" font-size="32" font-weight="800" fill="#0F141A">AF Wealth Mindset</text>
    <text x="${PAD_X + 110}" y="${TOP + 80}" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="500" fill="#5B6770">@afwealthmindset</text>
    <text x="${PAD_X}" y="${dearY}" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="700" fill="#0F141A">Dear ${persona},</text>
    ${lines.map((line, i) => `<text x="${PAD_X}" y="${lineStartY + i * LINE_H}" font-family="Helvetica, Arial, sans-serif" font-size="36" font-weight="500" fill="#0F141A">${line.replace(/&/g,'&amp;')}</text>`).join('\n    ')}
    ${closingLines.map((line, i) => `<text x="${PAD_X}" y="${closingY + i * 50}" font-family="Helvetica, Arial, sans-serif" font-size="32" font-weight="500" fill="#222C38">${line.replace(/&/g,'&amp;')}</text>`).join('\n    ')}
  </svg>`;
}

let count = 0;
for (const productId of Object.keys(LETTERS)) {
  LETTERS[productId].forEach((letter, idx) => {
    const slot = idx + 1;
    const svgPath = path.join(CARDS_DIR, `card-product-${productId}-${slot}.svg`);
    const pngPath = path.join(CARDS_DIR, `card-product-${productId}-${slot}.png`);
    fs.writeFileSync(svgPath, svg(letter), 'utf8');
    execSync(`npx --yes sharp-cli -i "${svgPath}" -o "${pngPath}" resize 1080 1350`, { stdio: 'inherit' });
    count++;
  });
}
console.log(`Generated ${count} dearson cards (4 products × 8 letters).`);
