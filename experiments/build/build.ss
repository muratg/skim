#!/usr/bin/env skim

(define-library (skim build)
  (display "hello!") (newline)
  (define files
    (list "./boot/skim-boot-parser.skim"
          "./boot/skim-boot-emitter.skim"
          "./boot/skim-boot-environ.skim"
          "./boot/skim-boot-cli.skim"
          "./boot/skim-example.skim"))
  (map (lambda (f)
         (define ret (skim-exec (string-join (list "skim" f) " ")))
         (display ret) (newline))
       files)
  (display "done.") (newline))
