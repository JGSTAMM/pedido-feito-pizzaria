<?php foreach(file('app/Console/Commands/FixUtf8Encoding.php') as $i => $line) { if ($i >= 30 && $i <= 35) echo $i . ': ' . bin2hex($line) . PHP_EOL; }
