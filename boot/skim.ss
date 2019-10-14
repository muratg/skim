; TODO: bug: order can cause infinite loop. try putting env on top.
(load "./boot/skim-boot-parser.skim")
(load "./boot/skim-boot-environ.skim")
(load "./boot/skim-boot-emitter.skim")

(import (only (skim boot emitter) compile_basic))

(define (print x) (display x) (newline))



(define (make-repl print prompt set_prompt close)
  (define (on-line line)
    (define output (compile_basic line))
    (print (skim-js-eval output)))
  (define (on-start) (print "hello! skim repl is not ready. it can only do single line expressions. ctrl-c to exit."))
  (define (on-close) (print "bye!"))
  ;; return 3 values
  (values on-line on-start on-close))


(define (start-repl)
 (define rl (skim-readline-create))

 (define (rl-prompt x) (skim-readline-prompt rl x))
 (define (rl-set-prompt x) (skim-readline-setPrompt rl x))
 (define (rl-close) (skim-readline-close rl))
 (define (rl-on ev fn) (skim-readline-on rl ev fn))
 (define-values (on-line on-start on-close) (make-repl print rl-prompt rl-set-prompt rl-close))
 (rl-on "line" on-line)
 (rl-on "close" on-close)

 (on-start))

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
  (set! help (string-append help "skim -h: show this help" "\n"))
  (set! help (string-append help "skim -c filename: compile file" "\n"))
  (set! help (string-append help "skim -C \"expr\" : show compiled expression" "\n"))
  (set! help (string-append help "skim -e \"expr\": evaluate expression" "\n"))
  (display help))

(define help-text
  (display
    (string-join
    '(
      )
    "\n")))

(define (start)
  (define args (command-line))
  ; (display "*** command-line: " ) (print args)
  (define output "")
  (cond
    ((= 1 (length args)) (start-repl))
    ((= 2 (length args))
     (define _1 (list-ref args 1))
     (cond ((string=? "-h" _1)
            (skim-help))
           (else
             (set! output (compile_file _1 #f))
             (skim-js-eval output))))
    ((= 3 (length args))
     (let* ((_1 (list-ref args 1))
            (_2 (list-ref args 2)))
       (case _1
         (("-c") (compile_file _2 #t) (print "done."))
         (("-C") (print (string-append "" (compile_basic _2))))
         (("-e")
          (define output (compile_basic _2))
          (print (skim-js-eval output)))
         (else (print (string-append "unknown option: '" _1 "'")) (skim-help) ))
       ))
    (else (skim-help))))

(start)
