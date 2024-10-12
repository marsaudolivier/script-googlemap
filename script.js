function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomInt(min = 0, max) {
    if (!max) {
        max = min;
        min = 0;
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleepRandom(min = 0, max) {
    return sleep(getRandomInt(min, max));
}

function getEmails(pageContent) {
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = pageContent.match(regex) || [];
    return emails;
}

function getPhoneNumbers(pageContent) {
    const regex1 = /(?<!\d)0[1-9][0-9]{8}(?<!\d)/g;
    const regex2 = /0[1-9](\.|\s|-)[0-9]{2}(\.|\s|-)[0-9]{2}(\.|\s|-)[0-9]{2}(\.|\s|-)[0-9]{2}/g;
    const regex3 = /(?<!\d)\+[0-9]{2}[0-9]{9}(?<!\d)/g;
    const regex4 = /\+[0-9]{2}(\.|\s|-)[0-9](\.|\s|-)[0-9]{2}(\.|\s|-)[0-9]{2}(\.|\s|-)[0-9]{2}(\.|\s|-)[0-9]{2}/g;
    const regex5 = /\+[0-9]{3}(\.|\s|-)[0-9]{2}(\.|\s|-)[0-9]{2}(\.|\s|-)[0-9]{2}(\.|\s|-)[0-9]{2}/g;

    const getMatches = (text, regex) => text.match(regex) || [];

    const phones = [
        ...new Set([
            ...getMatches(pageContent, regex1),
            ...getMatches(pageContent, regex2),
            ...getMatches(pageContent, regex3),
            ...getMatches(pageContent, regex4),
            ...getMatches(pageContent, regex5)
        ])
    ];
    return phones;
}

function getContactsFromText(pageContent) {
    const emails = getEmails(pageContent);
    const phoneNumbers = getPhoneNumbers(pageContent);

    const uniqueEmails = [...new Set(emails)];
    const uniquePhoneNumbers = [...new Set(phoneNumbers)];

    return {
        email: uniqueEmails?.[0] ?? null,
        phone: uniquePhoneNumbers?.[0] ?? null
    };
}

async function getContacts(scrollCount = 5) {
    const scrollArea = document.querySelector('[role="feed"]');

    if (!scrollArea) return [];

    let scrollAmount = 0;
    const processedTitles = new Set(); // Set pour suivre les titres déjà traités
    const contacts = [];

    for (let i = 0; i <= scrollCount; i++) {
        scrollArea.scrollTo(0, scrollAmount + 10_000);
        scrollAmount += 10_000;
        await sleepRandom(1000, 1500);
    }

    const items = Array.from(scrollArea.querySelectorAll('a.hfpxzc'));
    console.log({ items });

    for (const item of items) {
        item.click();
        await sleepRandom(700, 1200);

        const itemData = document.querySelector(
            '#QA0Szd > div > div > div.w6VYqd > div.bJzME.Hu9e2e.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.m6QErb.DxyBCb.kA9KIf.dS8AEf'
        );

        const title =
            itemData.querySelector('h1')?.textContent?.replace(/,/g, ' ') ?? '';

        // Vérification si le titre a déjà été traité
        if (processedTitles.has(title)) {
            console.log('Lieu déjà traité : ' + title);
            continue;
        }

        processedTitles.add(title); // Ajout du titre traité au Set

        const contactInfos = getContactsFromText(itemData?.textContent ?? '');

        const address =
            document
                .querySelector('[data-item-id="address"]')
                ?.textContent?.replace(/,/g, ' ')
                ?.replace('', '') ?? '';

        const website =
            document
                .querySelector('[aria-label^="Site Web:"]')
                ?.textContent?.replace(/,/g, '')
                ?.replace('', '') ?? '';

        const note =
            document
                .querySelector(
                    '#QA0Szd > div > div > div.w6VYqd > div.bJzME.Hu9e2e.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.m6QErb.DxyBCb.kA9KIf.dS8AEf > div.TIHn2 > div > div.lMbq3e > div.LBgpqf > div > div.fontBodyMedium.dmRWX > div.F7nice > span:nth-child(1) > span:nth-child(1)'
                )
                ?.textContent?.replaceAll(/,/g, '.') ?? '';

        const numberOfReviews =
            document
                .querySelector(
                    '#QA0Szd > div > div > div.w6VYqd > div.bJzME.Hu9e2e.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.m6QErb.DxyBCb.kA9KIf.dS8AEf > div.TIHn2 > div > div.lMbq3e > div.LBgpqf > div > div.fontBodyMedium.dmRWX > div.F7nice > span:nth-child(2) > span > span'
                )
                ?.textContent?.slice(1, 2) ?? '';

        const newContact = {
            title,
            address,
            website,
            ...contactInfos,
            note,
            numberOfReviews
        };

        console.log('New contact:' + newContact.title + ' | ' + newContact.address);

        contacts.push(newContact);
    }

    console.log('Done! Downloading contacts ✅ Find it at Downloads/data.csv');

    return contacts;
}

function downloadData(data) {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);

    const csv = [headers.join(',')];

    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            return `"${value !== null && value !== undefined ? value : ''}"`;
        });
        csv.push(values.join(','));
    });

    const final = csv.join('\n');

    const blob = new Blob([final], {
        type: 'text/csv'
    });

    const a = document.createElement('a');
    a.style.display = 'none';
    document.body.appendChild(a);

    const url = window.URL.createObjectURL(blob);
    a.href = url;

    a.download = 'data.csv';

    a.click();

    window.URL.revokeObjectURL(url);

    document.body.removeChild(a);
}

getContacts(5).then(data => downloadData(data));
