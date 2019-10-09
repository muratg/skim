(define-library
  (skim lang parser)
  (export parse)

  (define (make-parser-state)
    (define parser-state (make-hash-table))
    (hash-table-set! parse-state "stream" "")
    (hash-table-set! parse-state "pos" 0)
    (hash-table-set! parse-state "needs-input" #f)
    parser-state)

  (define $PS (make-parser-state))
  (define (stream) (hash-table-ref $PS "stream"))
  (define (pos) (hash-table-ref $PS "pos"))
  (define (stream-set! v) (hash-table-set! $PS "stream" v))
  (define (pos-set! v) (hash-table-set! $PS "pos" v))

  (define (peek)
    (if (= (string-length (stream)) (pos))
        ""
        (string-ref (stream) (pos))))

  (define (use)
    (define ret (peek))
    (unless (string=? ret "")
      (pos-set! (+ (pos) 1)))
    ret)

  (define (until rx)
    (do ((ret "" ret))
      ((regex-test rx (peek))
       ret)
      (set! ret (string-append ret (use)))))



  (define (parse inp)

    inp
    ))
