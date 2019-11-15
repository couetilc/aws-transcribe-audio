#!/usr/bin/python
import re
import string


popular_words = map(string.rstrip, open("tests/words_alpha.txt").readlines())
print len(popular_words)

vocabulary = []

with open("metadata_words.txt", "r") as word_dump:
    for line in word_dump:
        for phrase in re.split("[,.;\s]", line):
            phrase = phrase.lower()
            phrase = re.sub(r'[^A-Za-z.-]', '', phrase).strip()
            if not re.match(r'^[\s-]*$', phrase) and len(phrase) > 0 and not phrase in vocabulary and not phrase in popular_words:
                assert(len(phrase) < 256)
                vocabulary.append('{}'.format(phrase))

with open("vocabulary_test.txt", "w") as vocabulary_file:
    vocabulary_file.write('\n'.join(vocabulary))
