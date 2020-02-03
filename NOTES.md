
A calculator (for brute force):
	http://rumkin.com/tools/password/passchk.php / 


"Most of the commonly used hashing algorithms doesn't go over 72 bytes anyway. A 12k bytes password is as secure as a 72 bytes password."
~https://security.stackexchange.com/questions/177708/is-it-a-good-idea-to-use-the-entire-unicode-range-to-generate-a-random-password#comment343198_177715

"Since a site that limits you to short passwords probably doesn't even hash their passwords properly (causing Unicode 
passwords to fail or be stored with the wrong encoding), you should almost never waste the time to bother with Unicode passwords
...), an attacker could be guessing your (in)-security questions or using chocolate cryptography to gain access to your account."
~[ibid]

"This [using unicode] approach could reduce your overall security in certain cases, not improve it... sites that invisibly translate Unicode to ASCII under the covers... it's virtually impossible to tell from outside if a site is properly handling your password data"
~[ibid]
(CM See also https://stackoverflow.com/questions/2460206/how-to-convert-from-unicode-to-ascii)

"A train station survey of 300 office workers carried out by Infosecurity Europe researchers in London revealed the disturbing statistic 
that 64 per cent would hand over their office computer passwords for a bar of chocolate "and a smile".

This percentage is marginally less than the last time Infosecurity Europe used this not-so-cunning honey trap trick, as reported by ENN."
~https://www.theregister.co.uk/2007/04/17/chocolate_password_survey/


