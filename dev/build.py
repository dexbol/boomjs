import re
import os
from shutil import copyfile
import bomb

boom = open('boom.js')
lines = boom.readlines()
newContent = []
debugging = False
rdebugstart = re.compile(r'^\s*\/\/\s*for debug\s*$')
rdebugend = re.compile(r'^\s*\/\/\s*for debug end\s*$')
rlog = re.compile(r'\s*console\.')
for line in lines:
	matchstart = re.match(rdebugstart, line)
	matchend = re.match(rdebugend, line)
	if matchstart:
		debugging = True
	if matchend:
		debugging = False
		continue
	if debugging or re.match(rlog, line):
		continue
	else:
		newContent.append(line)

boom = open('..' + os.sep + 'boom.js', 'w')
boom.write(''.join(newContent))
boom.close()
copyfile('boom.js', '..' + os.sep + 'boom-debug.js')
bomb.compile_js('..' + os.sep + 'boom.js', '..' + os.sep + 'boom-min.js')

