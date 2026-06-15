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

// 16 letters per product = 64 unique cards. Worker rotates by calendar_id % 16.
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
    { persona: 'me before payday', lines: ['You feel rich for three days.', 'You feel normal by day ten.', 'You feel scared by day twenty.', 'The pattern is the problem, not the paycheck.'], closing: 'A bigger salary will not fix a leaking bucket. The leak gets bigger with the bucket.' },
    { persona: 'me with five subscriptions', lines: ['Open your card statement.', 'Find every monthly charge under twenty dollars.', 'Cancel anything you forgot you had.', 'Wait thirty days.', 'You will not miss them.'], closing: 'Most of what you pay for is for the version of you that signed up six months ago. That person is gone.' },
    { persona: 'me on the phone with the bank', lines: ['Call. Just call.', 'Ask for a lower rate. Ask for a fee waived.', 'They say no? Hang up. Call again.', 'Different person. Same ask.'], closing: 'Banks count on your silence. Speaking up costs nothing and pays back for years.' },
    { persona: 'me who saves what is left over', lines: ['Nothing is left over.', 'Save first. Spend the rest.', 'Even if it is forty dollars.', 'The habit is the asset, not the amount.'], closing: 'You will never get richer waiting for "extra" money. Pay yourself before the world bills you.' },
    { persona: 'me who avoids the receipts', lines: ['You took the receipt.', 'You put it in the bag.', 'You never looked.', 'Make a folder. Read it once a week.'], closing: 'Information you avoid does not stop existing. It just stops helping you.' },
    { persona: 'me at the grocery store hungry', lines: ['Never shop hungry.', 'Make a list. Stick to it.', 'Skip the inner aisles.', 'Use cash if the card hurts less.'], closing: 'A forty-dollar grocery run that becomes ninety is not bad luck. It is a system that needs one rule.' },
    { persona: 'me with the new job offer', lines: ['Negotiate. Always.', 'The first number is a question, not an answer.', 'Three thousand more now is fifty thousand more in ten years.', 'Ask for it.'], closing: 'They expected you to ask. The shame of asking is smaller than the cost of not.' },
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
    { persona: 'me who confuses revenue with success', lines: ['Six figures of revenue is a number.', 'Six figures of profit is freedom.', 'Two thousand a month in margin is more than ten thousand in gross.', 'Track what stays.'], closing: 'Wall Street talks about revenue. Business owners survive on margin. Pick which one you are.' },
    { persona: 'me before the first hire', lines: ['Hire late. Train early.', 'Document everything you do for a week.', 'Then hire someone to do that.', 'Not the other way around.'], closing: 'Founders who hire to escape a task end up paying twice. Hire to scale a system. Not to bury a problem.' },
    { persona: 'me without an emergency fund for the business', lines: ['One slow month does not need to kill you.', 'Save three months of expenses in cash.', 'Boring. Cold storage. Untouchable.', 'The fund is the freedom.'], closing: 'Most small businesses do not die from bad ideas. They die from one ordinary bad month and no buffer.' },
    { persona: 'me who never raised prices', lines: ['Two years. No change.', 'Costs went up. Yours did not.', 'Raise ten percent. Lose nobody who matters.', 'Tell yourself it is allowed.'], closing: 'Most clients expect the increase. You imagined a fight that never comes.' },
    { persona: 'me who never tracked time', lines: ['That client pays well.', 'You worked sixty hours instead of twenty.', 'Your hourly rate is six dollars.', 'Track hours. The truth changes the bill.'], closing: 'Revenue per hour is the only honest number in service work. The rest is wishful thinking.' },
    { persona: 'me afraid to look at the books', lines: ['You feel the numbers in your stomach.', 'You avoid the spreadsheet for weeks.', 'You imagine the worst.', 'It is rarely the worst.', 'Look once. Breathe.'], closing: 'The number does not change by being avoided. It only gets bigger and scarier in your head.' },
    { persona: 'me who took every client', lines: ['Some clients drain you.', 'Some clients pay you.', 'Some do both.', 'Track which ones make you tired by Wednesday. Fire two of them.'], closing: 'You can grow revenue by adding clients. Or by removing the ones who cost you the others.' },
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
    { persona: 'me at a one percent rate hike', lines: ['One percent does not sound like much.', 'On thirty thousand of debt, it is three hundred a year.', 'It is not the rate that gets you.', 'It is being asleep while it changes.'], closing: 'Stay awake to the rate. Refinance when it makes sense. Move before it moves you.' },
    { persona: 'me before consolidation', lines: ['Consolidation does not erase debt.', 'It moves it. Sometimes cheaper. Sometimes longer.', 'Read the fine print.', 'Five years at six percent is not freedom. It is comfort.'], closing: 'A lower monthly is not the same as a lower total. The math tells the truth. Read it.' },
    { persona: 'me with a windfall', lines: ['Bonus. Tax return. Gift.', 'Do not spend it on something to make you feel rich.', 'Pay down the highest rate.', 'Your future self gets the gift.'], closing: 'Windfalls are paid forward or paid out. Compounding is the difference. Choose forward.' },
    { persona: 'me whose minimum keeps growing', lines: ['Your minimum payment went up?', 'Read the statement.', 'New rate. New balance. New fee.', 'The bank told you. You did not look.'], closing: 'The statement is a love letter from the bank. Read every word. They mean what they say.' },
    { persona: 'me who skipped the small wins', lines: ['You paid off the credit card.', 'You celebrated for one day.', 'Then you forgot.', 'Mark every small win. Loud.'], closing: 'Quiet wins lose to loud setbacks. Make your wins loud. Brain works on loud.' },
    { persona: 'me at the limit', lines: ['The card hit ninety percent of the limit.', 'You felt nothing.', 'You should feel something.', 'Build a fence at fifty percent. Walk away when you see it.'], closing: 'A limit is the bank gambling on your shame. Build a smaller line in your own head.' },
    { persona: 'me using credit for groceries', lines: ['It happens.', 'It should not be normal.', 'If groceries are on credit, find one fixed cost to cut.', 'Real fix. Not promises.'], closing: 'When credit pays for food, the math is broken. One real change beats six promises of change.' },
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
    { persona: 'me thinking January is far away', lines: ['It is not.', 'Holiday gifts. Travel. New year fees.', 'Save fifty dollars a paycheck starting now.', 'December feels different when November already paid.'], closing: 'The future feels far until it is on Friday. Save toward dates that arrive on a calendar.' },
    { persona: 'me with irregular income', lines: ['Some months are great. Some months are bare.', 'Pay yourself a flat salary from the great months.', 'Hold the rest.', 'Let your salary be boring.'], closing: 'Wealth is not made in your great months. It is made by surviving the bare ones without panic.' },
    { persona: 'me at the kitchen table on Sunday', lines: ['Look at the week.', 'What is due. What is coming in. What is missing.', 'Fifteen minutes.', 'Coffee. Pencil. Done.'], closing: 'Fifteen minutes of looking on Sunday saves seven days of guessing. The math is unbelievable.' },
    { persona: 'me whose insurance just renewed', lines: ['Open the bill.', 'Compare three quotes.', 'Switch if it saves more than one hundred a year.', 'Set a reminder for next year.'], closing: 'Loyalty to a brand is paid in dollars. They do not love you back.' },
    { persona: 'me three weeks before vacation', lines: ['Count what you spent on the last one.', 'Multiply by 1.4.', 'That is the real number.', 'Save half before you book.'], closing: 'Most vacations are paid for nine months after they happen. Pay for them first.' },
    { persona: 'me with no savings rate goal', lines: ['Twenty percent is the rule.', 'Five percent is a start.', 'Zero is a habit you are training.', 'Pick a number and write it on the fridge.'], closing: 'A goal you can see beats an intention you forget. Pencil. Fridge. Today.' },
    { persona: 'me without a sinking fund', lines: ['Car repair is not an emergency.', 'It is a guarantee.', 'Same with vet bills and broken phones.', 'Save twenty-five a week. Call it the inevitable fund.'], closing: 'Most emergencies are predictable to anyone who is paying attention. Pay attention.' },
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
console.log(`Generated ${count} dearson cards (4 products × ${LETTERS[2].length} letters).`);
