; TODO: bug: order can cause infinite loop. try putting env on top.
(load "./boot/skim-boot-parser.skim")
(load "./boot/skim-boot-environ.skim")
(load "./boot/skim-boot-emitter.skim")

(import (only (skim boot emitter) compile_basic))

(define (print x)
  (display x)
  (newline))

(define (compile_file name save_output)
  (define source (skim-load name))
  (define output (compile_basic source))
  (when save_output
    (define new-name (string-replace name ".skim" ".js"))
    (set! new-name (string-replace new-name ".ss" ".js"))
    (set! new-name (string-replace new-name ".scm" ".js"))
    (skim-save new-name output))
  output)

(define output "")

(define (skim-help)
  (define help "")
  (set! help (string-append help "SkimJS" "\n"))
  (set! help (string-append help "skim: repl/TBD" "\n"))
  (set! help (string-append help "skim filename: run file" "\n"))
  (set! help (string-append help "skim -c filename: compile file" "\n"))
  (display help))

(define (start)
  (define args (command-line))
  ; (display "*** command-line: " ) (print args)
  (define output "")
  (cond
    ((= 1 (length args)) (skim-help))
    ((= 2 (length args))
     (set! output (compile_file (list-ref args 1) #f))
     (skim-js-eval output)
     )
    ((= 3 (length args))
     (let* ((_1 (list-ref args 1))
            (_2 (list-ref args 2)))
       (if (string=? _1 "-c")
           (set! output (compile_file (list-ref args 2) #t))
           (print (string-append "unknown option: '" _1 "'")))
       ))
    (else (skim-help))))

(start)
